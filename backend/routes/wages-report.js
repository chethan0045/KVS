const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const BrickProduction = require('../models/BrickProduction');
const KilnLoading = require('../models/KilnLoading');
const KilnManufacture = require('../models/KilnManufacture');
const BrickSale = require('../models/BrickSale');
const WagePayment = require('../models/WagePayment');

// GET / - Wages report per employee
router.get('/', async (req, res) => {
  try {
    const { start_date, end_date, employee_id } = req.query;

    // Build date filters
    const prodDateFilter = {};
    const loadingDateFilter = {};
    const manufactureDateFilter = {};
    if (start_date) {
      prodDateFilter.$gte = new Date(start_date);
      loadingDateFilter.$gte = new Date(start_date);
      manufactureDateFilter.$gte = new Date(start_date);
    }
    if (end_date) {
      prodDateFilter.$lte = new Date(end_date);
      loadingDateFilter.$lte = new Date(end_date);
      manufactureDateFilter.$lte = new Date(end_date);
    }

    const prodQuery = {};
    if (start_date || end_date) prodQuery.production_date = prodDateFilter;
    if (employee_id) prodQuery.employee_id = employee_id;
    // Only productions with an employee assigned
    prodQuery.employee_id = employee_id ? employee_id : { $ne: null };

    const loadingQuery = {};
    if (start_date || end_date) loadingQuery.loading_date = loadingDateFilter;
    if (employee_id) loadingQuery.employees = employee_id;

    const manufactureQuery = {};
    if (start_date || end_date) manufactureQuery.manufacture_date = manufactureDateFilter;
    if (employee_id) manufactureQuery.employees = employee_id;

    const saleQuery = {};
    const saleDateFilter = {};
    if (start_date) saleDateFilter.$gte = new Date(start_date);
    if (end_date) saleDateFilter.$lte = new Date(end_date);
    if (start_date || end_date) saleQuery.sale_date = saleDateFilter;
    if (employee_id) {
      saleQuery.$or = [{ driver_id: employee_id }, { helper_id: employee_id }];
    }

    const paymentQuery = {};
    if (employee_id) paymentQuery.employee_id = employee_id;

    const [productions, loadings, manufactures, sales, employees, payments] = await Promise.all([
      BrickProduction.find(prodQuery).populate('employee_id').lean(),
      KilnLoading.find(loadingQuery).populate('employees').lean(),
      KilnManufacture.find(manufactureQuery).populate('employees').lean(),
      BrickSale.find(saleQuery).populate('driver_id').populate('helper_id').populate('customer_id').lean(),
      employee_id
        ? Employee.find({ _id: employee_id }).lean()
        : Employee.find().sort({ name: 1 }).lean(),
      WagePayment.find(paymentQuery).sort({ paid_at: 1 }).lean()
    ]);

    // Build wages map per employee
    const wagesMap = {};

    // Initialize all relevant employees
    for (const emp of employees) {
      wagesMap[emp._id.toString()] = {
        employee_id: emp._id,
        employee_name: emp.name,
        total_production_wages: 0,
        total_loading_wages: 0,
        total_manufacturing_wages: 0,
        total_brick_load_wages: 0,
        grand_total: 0,
        total_wages_earned: emp.total_wages_earned || 0,
        total_paid: emp.total_paid || 0,
        balance: emp.balance || 0,
        production_details: [],
        loading_details: [],
        manufacturing_details: [],
        brick_load_details: []
      };
    }

    // Process brick productions (wage = quantity * 1.1 per employee)
    for (const prod of productions) {
      if (!prod.employee_id) continue;
      const empId = (typeof prod.employee_id === 'object' ? prod.employee_id._id : prod.employee_id).toString();
      const wages = prod.quantity * 1.1;

      if (!wagesMap[empId]) {
        const empName = typeof prod.employee_id === 'object' ? prod.employee_id.name : 'Unknown';
        wagesMap[empId] = {
          employee_id: empId,
          employee_name: empName,
          total_production_wages: 0,
          total_loading_wages: 0,
          total_manufacturing_wages: 0,
          total_brick_load_wages: 0,
          grand_total: 0,
          total_paid: 0,
          balance: 0,
          production_details: [],
          loading_details: [],
          manufacturing_details: [],
          brick_load_details: []
        };
      }
      wagesMap[empId].total_production_wages += wages;
      wagesMap[empId].production_details.push({
        batch_number: prod.batch_number,
        production_date: prod.production_date,
        quantity: prod.quantity,
        wages_earned: wages
      });
    }

    // Process kiln loadings (wage split among employees)
    for (const loading of loadings) {
      if (!loading.employees || loading.employees.length === 0) continue;
      const perEmployeeWage = loading.total_wages / loading.employees.length;

      for (const emp of loading.employees) {
        const empId = emp._id.toString();
        // Skip employees not in filter
        if (employee_id && empId !== employee_id) continue;
        if (!wagesMap[empId]) {
          wagesMap[empId] = {
            employee_id: emp._id,
            employee_name: emp.name,
            total_production_wages: 0,
            total_loading_wages: 0,
            total_manufacturing_wages: 0,
            grand_total: 0,
            total_paid: 0,
            balance: 0,
            production_details: [],
            loading_details: [],
            manufacturing_details: []
          };
        }
        wagesMap[empId].total_loading_wages += perEmployeeWage;
        wagesMap[empId].loading_details.push({
          kiln_number: loading.kiln_number,
          loading_date: loading.loading_date,
          quantity_loaded: loading.quantity_loaded,
          employees_count: loading.employees.length,
          wages_earned: perEmployeeWage
        });
      }
    }

    // Process kiln manufactures (wage split among employees)
    for (const manufacture of manufactures) {
      if (!manufacture.employees || manufacture.employees.length === 0) continue;
      const perEmployeeWage = manufacture.total_wages / manufacture.employees.length;

      for (const emp of manufacture.employees) {
        const empId = emp._id.toString();
        // Skip employees not in filter
        if (employee_id && empId !== employee_id) continue;
        if (!wagesMap[empId]) {
          wagesMap[empId] = {
            employee_id: emp._id,
            employee_name: emp.name,
            total_production_wages: 0,
            total_loading_wages: 0,
            total_manufacturing_wages: 0,
            grand_total: 0,
            total_paid: 0,
            balance: 0,
            production_details: [],
            loading_details: [],
            manufacturing_details: []
          };
        }
        wagesMap[empId].total_manufacturing_wages += perEmployeeWage;
        wagesMap[empId].manufacturing_details.push({
          manufacture_date: manufacture.manufacture_date,
          work_type: manufacture.quality_grade || 'Kiln Work',
          employees_count: manufacture.employees.length,
          wages_earned: perEmployeeWage
        });
      }
    }

    // Process brick sales (driver/helper wages as "Brick Load")
    for (const sale of sales) {
      const customerName = sale.customer_id && typeof sale.customer_id === 'object' ? sale.customer_id.name : '';

      // Driver wages
      if (sale.driver_id) {
        const driverId = (typeof sale.driver_id === 'object' ? sale.driver_id._id : sale.driver_id).toString();
        // Skip if filtering and this is not the filtered employee
        if (!employee_id || driverId === employee_id) {
          const driverWage = sale.driver_wage || 750;
          if (!wagesMap[driverId]) {
            const driverName = typeof sale.driver_id === 'object' ? sale.driver_id.name : 'Unknown';
            wagesMap[driverId] = {
              employee_id: driverId, employee_name: driverName,
              total_production_wages: 0, total_loading_wages: 0, total_manufacturing_wages: 0, total_brick_load_wages: 0,
              grand_total: 0, total_paid: 0, balance: 0,
              production_details: [], loading_details: [], manufacturing_details: [], brick_load_details: []
            };
          }
          wagesMap[driverId].total_brick_load_wages += driverWage;
          wagesMap[driverId].brick_load_details.push({
            sale_date: sale.sale_date, customer: customerName, quantity: sale.quantity_sold,
            role: 'Driver', wages_earned: driverWage
          });
        }
      }

      // Helper wages
      if (sale.helper_id) {
        const helperId = (typeof sale.helper_id === 'object' ? sale.helper_id._id : sale.helper_id).toString();
        // Skip if filtering and this is not the filtered employee
        if (!employee_id || helperId === employee_id) {
          const helperWage = sale.helper_wage || 500;
          if (!wagesMap[helperId]) {
            const helperName = typeof sale.helper_id === 'object' ? sale.helper_id.name : 'Unknown';
            wagesMap[helperId] = {
              employee_id: helperId, employee_name: helperName,
              total_production_wages: 0, total_loading_wages: 0, total_manufacturing_wages: 0, total_brick_load_wages: 0,
              grand_total: 0, total_paid: 0, balance: 0,
              production_details: [], loading_details: [], manufacturing_details: [], brick_load_details: []
            };
          }
          wagesMap[helperId].total_brick_load_wages += helperWage;
          wagesMap[helperId].brick_load_details.push({
            sale_date: sale.sale_date, customer: customerName, quantity: sale.quantity_sold,
            role: 'Helper', wages_earned: helperWage
          });
        }
      }
    }

    // Attach payment history to each employee
    for (const payment of payments) {
      const empId = payment.employee_id.toString();
      if (wagesMap[empId]) {
        if (!wagesMap[empId].payment_history) wagesMap[empId].payment_history = [];
        wagesMap[empId].payment_history.push({
          amount: payment.amount,
          paid_at: payment.paid_at
        });
      }
    }

    // Calculate grand totals and filter to only the selected employee if filtered
    let result = Object.values(wagesMap).map(entry => {
      entry.grand_total = entry.total_production_wages + entry.total_loading_wages + entry.total_manufacturing_wages + entry.total_brick_load_wages;
      if (!entry.payment_history) entry.payment_history = [];
      return entry;
    });

    if (employee_id) {
      result = result.filter(entry => entry.employee_id.toString() === employee_id);
    }

    result.sort((a, b) => a.employee_name.localeCompare(b.employee_name));
    const overall_total = result.reduce((sum, r) => sum + r.grand_total, 0);

    res.json({
      wages: result,
      overall_total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
