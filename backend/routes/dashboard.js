const express = require('express');
const router = express.Router();
const BrickProduction = require('../models/BrickProduction');
const KilnLoading = require('../models/KilnLoading');
const KilnManufacture = require('../models/KilnManufacture');
const BrickSale = require('../models/BrickSale');
const Employee = require('../models/Employee');
const HuskLoad = require('../models/HuskLoad');
const Customer = require('../models/Customer');
const WagePayment = require('../models/WagePayment');
const Archive = require('../models/Archive');

// Kiln slots offered on the Kiln Loading page; any extra kiln numbers found in data are merged in.
const KILN_SLOTS = ['1', '2', '3', '4'];

// Read one field off a single-group aggregate result, defaulting to 0.
const pick = (result, field = 'total') => (result.length > 0 ? result[0][field] || 0 : 0);

const sumOf = (Model, match, expr) =>
  Model.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: expr } } }]);

const nameOf = (ref) => (ref && typeof ref === 'object' ? ref.name : null);

// GET / - Dashboard summary stats
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      producedResult,
      inKilnResult,
      inFireResult,
      readyResult,
      salesResult,
      employeeResult,
      huskResult,
      customerResult,
      kilnResult,
      monthProducedResult,
      monthLoadedResult,
      monthSalesResult,
      monthWagePaidResult,
      monthHuskResult,
      topCustomers,
      topEmployees,
      recentProductions,
      recentLoadings,
      recentManufactures,
      recentSales,
      archives
    ] = await Promise.all([
      // --- Pipeline (all-time brick quantities) ---
      sumOf(BrickProduction, {}, '$quantity'),
      sumOf(KilnLoading, { status: 'loading' }, '$quantity_loaded'),
      sumOf(KilnLoading, { status: 'firing' }, '$quantity_loaded'),
      sumOf(KilnLoading, { status: 'ready' }, { $subtract: ['$quantity_loaded', { $ifNull: ['$quantity_sold', 0] }] }),
      BrickSale.aggregate([
        { $group: { _id: null, quantity: { $sum: '$quantity_sold' }, amount: { $sum: '$total_amount' }, count: { $sum: 1 } } }
      ]),

      // --- Ledgers (denormalized running totals) ---
      Employee.aggregate([
        { $group: {
          _id: null,
          earned: { $sum: '$total_wages_earned' },
          paid: { $sum: '$total_paid' },
          opening: { $sum: { $ifNull: ['$old_balance', 0] } },
          balance: { $sum: '$balance' },
          with_balance: { $sum: { $cond: [{ $gt: ['$balance', 0] }, 1, 0] } }
        } }
      ]),
      HuskLoad.aggregate([
        { $group: {
          _id: null,
          cost: { $sum: '$total_amount' },
          paid: { $sum: '$total_paid' },
          balance: { $sum: '$balance' },
          tonnage: { $sum: '$tonnage' },
          pending: { $sum: { $cond: [{ $gt: ['$balance', 0] }, 1, 0] } }
        } }
      ]),
      Customer.aggregate([
        { $group: {
          _id: null,
          amount: { $sum: '$total_amount' },
          paid: { $sum: '$total_paid' },
          balance: { $sum: '$balance' },
          with_balance: { $sum: { $cond: [{ $gt: ['$balance', 0] }, 1, 0] } }
        } }
      ]),

      // --- Per-kiln status. All loadings of a kiln share one status (PATCH /kiln-loadings/:id/status). ---
      KilnLoading.aggregate([
        { $sort: { loading_date: -1, createdAt: -1 } },
        { $group: {
          _id: '$kiln_number',
          status: { $first: '$status' },
          quantity_loaded: { $sum: '$quantity_loaded' },
          quantity_sold: { $sum: { $ifNull: ['$quantity_sold', 0] } },
          loadings: { $sum: 1 },
          first_loading_date: { $min: '$loading_date' },
          last_loading_date: { $max: '$loading_date' }
        } }
      ]),

      // --- This month (by business date, not creation time) ---
      sumOf(BrickProduction, { production_date: { $gte: monthStart } }, '$quantity'),
      sumOf(KilnLoading, { loading_date: { $gte: monthStart } }, '$quantity_loaded'),
      BrickSale.aggregate([
        { $match: { sale_date: { $gte: monthStart } } },
        { $group: { _id: null, quantity: { $sum: '$quantity_sold' }, amount: { $sum: '$total_amount' }, count: { $sum: 1 } } }
      ]),
      sumOf(WagePayment, { paid_at: { $gte: monthStart } }, '$amount'),
      HuskLoad.aggregate([
        { $match: { received_date: { $gte: monthStart } } },
        { $group: { _id: null, tonnage: { $sum: '$tonnage' }, cost: { $sum: '$total_amount' } } }
      ]),

      // --- Who owes us / whom we owe ---
      Customer.find({ balance: { $gt: 0 } }).sort({ balance: -1 }).limit(5)
        .select('name phone total_amount total_paid balance').lean(),
      Employee.find({ balance: { $gt: 0 } }).sort({ balance: -1 }).limit(5)
        .select('name status total_wages_earned total_paid balance').lean(),

      // --- Recent activity ---
      BrickProduction.find().sort({ createdAt: -1 }).limit(6).populate('employee_id', 'name').lean(),
      KilnLoading.find().sort({ createdAt: -1 }).limit(6).lean(),
      KilnManufacture.find().sort({ createdAt: -1 }).limit(6).populate('kiln_loading_id', 'kiln_number').lean(),
      BrickSale.find().sort({ createdAt: -1 }).limit(6).populate('customer_id', 'name').lean(),

      Archive.find().lean()
    ]);

    // Archived kilns were deleted from the live collections; fold their sales/loadings back in.
    let archivedSold = 0, archivedRevenue = 0, archivedSales = 0;
    let archivedMonthSold = 0, archivedMonthRevenue = 0, archivedMonthSales = 0, archivedMonthLoaded = 0;
    for (const arch of archives) {
      for (const s of (arch.sales || [])) {
        archivedSold += s.quantity_sold || 0;
        archivedRevenue += s.total_amount || 0;
        archivedSales += 1;
        if (s.sale_date && new Date(s.sale_date) >= monthStart) {
          archivedMonthSold += s.quantity_sold || 0;
          archivedMonthRevenue += s.total_amount || 0;
          archivedMonthSales += 1;
        }
      }
      const entries = (arch.kiln_loading && arch.kiln_loading.loading_entries) || [];
      for (const l of entries) {
        if (l.loading_date && new Date(l.loading_date) >= monthStart) {
          archivedMonthLoaded += l.quantity_loaded || 0;
        }
      }
    }

    const totalSold = pick(salesResult, 'quantity') + archivedSold;
    const totalRevenue = pick(salesResult, 'amount') + archivedRevenue;
    const totalSales = pick(salesResult, 'count') + archivedSales;

    // Kiln cards: fixed slots first, then any other kiln numbers present in data.
    const kilnMap = new Map(kilnResult.map(k => [String(k._id), k]));
    const kilnNumbers = [...new Set([...KILN_SLOTS, ...kilnMap.keys()])]
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const kilns = kilnNumbers.map(n => {
      const k = kilnMap.get(n);
      if (!k) {
        return { kiln_number: n, status: 'empty', quantity_loaded: 0, quantity_sold: 0, remaining: 0,
          loadings: 0, first_loading_date: null, last_loading_date: null };
      }
      return {
        kiln_number: n,
        status: k.status || 'loading',
        quantity_loaded: k.quantity_loaded,
        quantity_sold: k.quantity_sold,
        remaining: Math.max(0, k.quantity_loaded - k.quantity_sold),
        loadings: k.loadings,
        first_loading_date: k.first_loading_date,
        last_loading_date: k.last_loading_date
      };
    });

    const recentActivities = [
      ...recentProductions.map(p => ({
        type: 'production',
        label: 'Bricks produced',
        detail: [p.batch_number ? `Batch ${p.batch_number}` : null, nameOf(p.employee_id)].filter(Boolean).join(' · '),
        quantity: p.quantity,
        amount: null,
        date: p.production_date,
        created_at: p.createdAt
      })),
      ...recentLoadings.map(l => ({
        type: 'kiln_loading',
        label: `Kiln ${l.kiln_number} loaded`,
        detail: l.employees && l.employees.length ? `${l.employees.length} employee${l.employees.length === 1 ? '' : 's'}` : '',
        quantity: l.quantity_loaded,
        amount: null,
        date: l.loading_date,
        created_at: l.createdAt
      })),
      ...recentManufactures.map(m => ({
        type: 'manufacture',
        label: m.quality_grade || 'Kiln work',
        detail: m.kiln_loading_id && m.kiln_loading_id.kiln_number ? `Kiln ${m.kiln_loading_id.kiln_number}` : '',
        quantity: null,
        amount: m.total_wages || 0,
        date: m.manufacture_date,
        created_at: m.createdAt
      })),
      ...recentSales.map(s => ({
        type: 'sale',
        label: 'Bricks sold',
        detail: nameOf(s.customer_id) || '',
        quantity: s.quantity_sold,
        amount: s.total_amount,
        date: s.sale_date,
        created_at: s.createdAt
      }))
    ]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8);

    res.json({
      summary: {
        total_produced: pick(producedResult),
        total_in_kiln: pick(inKilnResult),
        total_in_fire: pick(inFireResult),
        total_ready: Math.max(0, pick(readyResult)),
        total_sold: totalSold,
        total_sales: totalSales,
        total_revenue: totalRevenue,
        avg_price_per_brick: totalSold > 0 ? totalRevenue / totalSold : 0,

        // Employee ledger: balance = earned - paid + opening balance
        wages_earned: pick(employeeResult, 'earned'),
        wages_paid: pick(employeeResult, 'paid'),
        wages_opening_balance: pick(employeeResult, 'opening'),
        wages_balance: pick(employeeResult, 'balance'),
        employees_with_balance: pick(employeeResult, 'with_balance'),

        husk_total_cost: pick(huskResult, 'cost'),
        husk_total_paid: pick(huskResult, 'paid'),
        husk_balance: pick(huskResult, 'balance'),
        husk_total_tonnage: pick(huskResult, 'tonnage'),
        husk_pending_loads: pick(huskResult, 'pending'),

        customer_total_amount: pick(customerResult, 'amount'),
        customer_total_paid: pick(customerResult, 'paid'),
        customer_balance: pick(customerResult, 'balance'),
        customers_with_balance: pick(customerResult, 'with_balance')
      },
      this_month: {
        from: monthStart,
        produced: pick(monthProducedResult),
        loaded: pick(monthLoadedResult) + archivedMonthLoaded,
        sold: pick(monthSalesResult, 'quantity') + archivedMonthSold,
        revenue: pick(monthSalesResult, 'amount') + archivedMonthRevenue,
        sales_count: pick(monthSalesResult, 'count') + archivedMonthSales,
        wages_paid: pick(monthWagePaidResult),
        husk_tonnage: pick(monthHuskResult, 'tonnage'),
        husk_cost: pick(monthHuskResult, 'cost')
      },
      kilns,
      top_customers: topCustomers,
      top_employees: topEmployees,
      recent_activities: recentActivities
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
