const express = require('express');
const router = express.Router();
const BrickProduction = require('../models/BrickProduction');
const KilnLoading = require('../models/KilnLoading');
const KilnManufacture = require('../models/KilnManufacture');
const BrickSale = require('../models/BrickSale');
const Employee = require('../models/Employee');
const HuskLoad = require('../models/HuskLoad');
const Customer = require('../models/Customer');

// GET / - Dashboard summary stats
router.get('/', async (req, res) => {
  try {
    const [
      totalProducedResult,
      totalInKilnResult,
      totalInFireResult,
      totalReadyResult,
      totalSoldResult,
      totalRevenueResult,
      totalProductionWagesResult,
      totalLoadingWagesResult,
      totalManufactureWagesResult,
      wagesBalanceResult,
      huskResult,
      customerResult,
      recentProductions,
      recentLoadings,
      recentManufactures,
      recentSales
    ] = await Promise.all([
      BrickProduction.aggregate([
        { $group: { _id: null, total: { $sum: '$quantity' } } }
      ]),
      KilnLoading.aggregate([
        { $match: { status: 'loading' } },
        { $group: { _id: null, total: { $sum: '$quantity_loaded' } } }
      ]),
      KilnLoading.aggregate([
        { $match: { status: 'firing' } },
        { $group: { _id: null, total: { $sum: '$quantity_loaded' } } }
      ]),
      KilnLoading.aggregate([
        { $match: { status: 'ready' } },
        { $group: { _id: null, total: { $sum: { $subtract: ['$quantity_loaded', { $ifNull: ['$quantity_sold', 0] }] } } } }
      ]),
      BrickSale.aggregate([
        { $group: { _id: null, total: { $sum: '$quantity_sold' } } }
      ]),
      BrickSale.aggregate([
        { $group: { _id: null, total: { $sum: '$total_amount' } } }
      ]),
      // Production wages = sum(quantity) * 1.1
      BrickProduction.aggregate([
        { $match: { employee_id: { $ne: null } } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$quantity', 1.1] } } } }
      ]),
      KilnLoading.aggregate([
        { $group: { _id: null, total: { $sum: '$total_wages' } } }
      ]),
      KilnManufacture.aggregate([
        { $group: { _id: null, total: { $sum: '$total_wages' } } }
      ]),
      Employee.aggregate([
        { $group: { _id: null, total: { $sum: '$balance' } } }
      ]),
      HuskLoad.aggregate([
        { $group: { _id: null, total_cost: { $sum: '$total_amount' }, total_paid: { $sum: '$total_paid' }, total_balance: { $sum: '$balance' } } }
      ]),
      Customer.aggregate([
        { $group: { _id: null, total_amount: { $sum: '$total_amount' }, total_paid: { $sum: '$total_paid' }, total_balance: { $sum: '$balance' } } }
      ]),
      BrickProduction.find().sort({ createdAt: -1 }).limit(5).lean(),
      KilnLoading.find().sort({ createdAt: -1 }).limit(5).lean(),
      KilnManufacture.find().sort({ createdAt: -1 }).limit(5).lean(),
      BrickSale.find().sort({ createdAt: -1 }).limit(5).lean()
    ]);

    const totalProduced = totalProducedResult.length > 0 ? totalProducedResult[0].total : 0;
    const totalInKiln = totalInKilnResult.length > 0 ? totalInKilnResult[0].total : 0;
    const totalInFire = totalInFireResult.length > 0 ? totalInFireResult[0].total : 0;
    const totalReady = totalReadyResult.length > 0 ? totalReadyResult[0].total : 0;
    const totalSold = totalSoldResult.length > 0 ? totalSoldResult[0].total : 0;
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    const totalProductionWages = totalProductionWagesResult.length > 0 ? totalProductionWagesResult[0].total : 0;
    const totalLoadingWages = totalLoadingWagesResult.length > 0 ? totalLoadingWagesResult[0].total : 0;
    const totalManufactureWages = totalManufactureWagesResult.length > 0 ? totalManufactureWagesResult[0].total : 0;
    const wagesBalance = wagesBalanceResult.length > 0 ? wagesBalanceResult[0].total : 0;

    const huskTotalCost = huskResult.length > 0 ? huskResult[0].total_cost : 0;
    const huskTotalPaid = huskResult.length > 0 ? huskResult[0].total_paid : 0;
    const huskBalance = huskResult.length > 0 ? huskResult[0].total_balance : 0;

    const customerTotalAmount = customerResult.length > 0 ? customerResult[0].total_amount : 0;
    const customerTotalPaid = customerResult.length > 0 ? customerResult[0].total_paid : 0;
    const customerBalance = customerResult.length > 0 ? customerResult[0].total_balance : 0;

    const recentActivities = [
      ...recentProductions.map(p => ({
        type: 'production',
        description: `Batch ${p.batch_number}`,
        quantity: p.quantity,
        created_at: p.createdAt
      })),
      ...recentLoadings.map(l => ({
        type: 'kiln_loading',
        description: `Kiln ${l.kiln_number}`,
        quantity: l.quantity_loaded,
        created_at: l.createdAt
      })),
      ...recentManufactures.map(m => ({
        type: 'manufacture',
        description: `Kiln manufacture`,
        quantity: m.quantity_manufactured,
        created_at: m.createdAt
      })),
      ...recentSales.map(s => ({
        type: 'sale',
        description: `Sale`,
        quantity: s.quantity_sold,
        created_at: s.createdAt
      }))
    ]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    res.json({
      summary: {
        total_produced: totalProduced,
        total_in_kiln: totalInKiln,
        total_in_fire: totalInFire,
        total_ready: Math.max(0, totalReady),
        total_sold: totalSold,
        total_revenue: totalRevenue,
        total_wages_paid: totalProductionWages + totalLoadingWages + totalManufactureWages,
        wages_balance: wagesBalance,
        husk_total_cost: huskTotalCost,
        husk_total_paid: huskTotalPaid,
        husk_balance: huskBalance,
        customer_total_amount: customerTotalAmount,
        customer_total_paid: customerTotalPaid,
        customer_balance: customerBalance
      },
      recent_activities: recentActivities
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
