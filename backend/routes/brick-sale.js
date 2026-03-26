const express = require('express');
const router = express.Router();
const BrickSale = require('../models/BrickSale');
const Customer = require('../models/Customer');
const KilnLoading = require('../models/KilnLoading');
const Employee = require('../models/Employee');

const populateFields = [
  { path: 'customer_id' },
  { path: 'kiln_loading_id' },
  { path: 'driver_id' },
  { path: 'helper_id' }
];

// Add wages to driver/helper
async function addDriverHelperWages(driverId, driverWage, helperId, helperWage) {
  if (driverId && driverWage) {
    await Employee.findByIdAndUpdate(driverId, {
      $inc: { total_wages_earned: driverWage, balance: driverWage }
    });
  }
  if (helperId && helperWage) {
    await Employee.findByIdAndUpdate(helperId, {
      $inc: { total_wages_earned: helperWage, balance: helperWage }
    });
  }
}

// Reverse wages from driver/helper
async function reverseDriverHelperWages(driverId, driverWage, helperId, helperWage) {
  if (driverId && driverWage) {
    await Employee.findByIdAndUpdate(driverId, {
      $inc: { total_wages_earned: -driverWage, balance: -driverWage }
    });
  }
  if (helperId && helperWage) {
    await Employee.findByIdAndUpdate(helperId, {
      $inc: { total_wages_earned: -helperWage, balance: -helperWage }
    });
  }
}

// GET /
router.get('/', async (req, res) => {
  try {
    const sales = await BrickSale.find().populate(populateFields).sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const sale = await BrickSale.findById(req.params.id).populate(populateFields);
    if (!sale) return res.status(404).json({ error: 'Brick sale not found' });
    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { customer_id, kiln_loading_id, quantity_sold, price_per_brick, total_amount, sale_date,
      driver_id, helper_id, driver_wage, helper_wage, payment_status, remarks } = req.body;

    if (!customer_id || !quantity_sold || !price_per_brick || !total_amount || !sale_date) {
      return res.status(400).json({ error: 'customer_id, quantity_sold, price_per_brick, total_amount, and sale_date are required' });
    }

    const customer = await Customer.findById(customer_id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    if (kiln_loading_id) {
      const kiln = await KilnLoading.findById(kiln_loading_id);
      if (!kiln) return res.status(404).json({ error: 'Kiln loading not found' });
      const remaining = kiln.quantity_loaded - (kiln.quantity_sold || 0);
      if (quantity_sold > remaining) {
        return res.status(400).json({ error: `Only ${remaining} bricks available in Kiln ${kiln.kiln_number}` });
      }
    }

    const dWage = driver_wage ?? 750;
    const hWage = helper_wage ?? 500;

    const sale = new BrickSale({
      customer_id,
      kiln_loading_id: kiln_loading_id || null,
      quantity_sold, price_per_brick, total_amount, sale_date,
      driver_id: driver_id || null,
      helper_id: helper_id || null,
      driver_wage: dWage,
      helper_wage: hWage,
      payment_status: payment_status || 'pending',
      remarks
    });

    const saved = await sale.save();

    // Update customer
    customer.total_bricks_bought += quantity_sold;
    customer.total_amount += total_amount;
    customer.balance = customer.total_amount - customer.total_paid;
    await customer.save();

    // Deduct from kiln
    if (kiln_loading_id) {
      await KilnLoading.findByIdAndUpdate(kiln_loading_id, { $inc: { quantity_sold: quantity_sold } });
    }

    // Add wages to driver/helper
    await addDriverHelperWages(saved.driver_id, saved.driver_wage, saved.helper_id, saved.helper_wage);

    const populated = await BrickSale.findById(saved._id).populate(populateFields);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const existing = await BrickSale.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Brick sale not found' });

    // Store old values
    const oldDriverId = existing.driver_id;
    const oldDriverWage = existing.driver_wage || 0;
    const oldHelperId = existing.helper_id;
    const oldHelperWage = existing.helper_wage || 0;

    const { customer_id, kiln_loading_id, quantity_sold, price_per_brick, total_amount, sale_date,
      driver_id, helper_id, driver_wage, helper_wage, payment_status, remarks } = req.body;

    // Reverse old customer
    const oldCustomer = await Customer.findById(existing.customer_id);
    if (oldCustomer) {
      oldCustomer.total_bricks_bought -= existing.quantity_sold;
      oldCustomer.total_amount -= existing.total_amount;
      oldCustomer.balance = oldCustomer.total_amount - oldCustomer.total_paid;
      await oldCustomer.save();
    }

    // Reverse old kiln
    if (existing.kiln_loading_id) {
      await KilnLoading.findByIdAndUpdate(existing.kiln_loading_id, { $inc: { quantity_sold: -existing.quantity_sold } });
    }

    // Reverse old driver/helper wages
    await reverseDriverHelperWages(oldDriverId, oldDriverWage, oldHelperId, oldHelperWage);

    // Update fields
    existing.customer_id = customer_id !== undefined ? customer_id : existing.customer_id;
    existing.kiln_loading_id = kiln_loading_id !== undefined ? kiln_loading_id : existing.kiln_loading_id;
    existing.quantity_sold = quantity_sold !== undefined ? quantity_sold : existing.quantity_sold;
    existing.price_per_brick = price_per_brick !== undefined ? price_per_brick : existing.price_per_brick;
    existing.total_amount = total_amount !== undefined ? total_amount : existing.total_amount;
    existing.sale_date = sale_date !== undefined ? sale_date : existing.sale_date;
    existing.driver_id = driver_id !== undefined ? (driver_id || null) : existing.driver_id;
    existing.helper_id = helper_id !== undefined ? (helper_id || null) : existing.helper_id;
    existing.driver_wage = driver_wage !== undefined ? driver_wage : existing.driver_wage;
    existing.helper_wage = helper_wage !== undefined ? helper_wage : existing.helper_wage;
    existing.payment_status = payment_status !== undefined ? payment_status : existing.payment_status;
    existing.remarks = remarks !== undefined ? remarks : existing.remarks;

    const updated = await existing.save();

    // Add new customer amounts
    const newCustomer = await Customer.findById(updated.customer_id);
    if (newCustomer) {
      newCustomer.total_bricks_bought += updated.quantity_sold;
      newCustomer.total_amount += updated.total_amount;
      newCustomer.balance = newCustomer.total_amount - newCustomer.total_paid;
      await newCustomer.save();
    }

    // Deduct from new kiln
    if (updated.kiln_loading_id) {
      await KilnLoading.findByIdAndUpdate(updated.kiln_loading_id, { $inc: { quantity_sold: updated.quantity_sold } });
    }

    // Add new driver/helper wages
    await addDriverHelperWages(updated.driver_id, updated.driver_wage, updated.helper_id, updated.helper_wage);

    const populated = await BrickSale.findById(updated._id).populate(populateFields);
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const existing = await BrickSale.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Brick sale not found' });

    // Reverse customer
    const customer = await Customer.findById(existing.customer_id);
    if (customer) {
      customer.total_bricks_bought -= existing.quantity_sold;
      customer.total_amount -= existing.total_amount;
      customer.balance = customer.total_amount - customer.total_paid;
      await customer.save();
    }

    // Reverse kiln
    if (existing.kiln_loading_id) {
      await KilnLoading.findByIdAndUpdate(existing.kiln_loading_id, { $inc: { quantity_sold: -existing.quantity_sold } });
    }

    // Reverse driver/helper wages
    await reverseDriverHelperWages(existing.driver_id, existing.driver_wage, existing.helper_id, existing.helper_wage);

    await BrickSale.findByIdAndDelete(req.params.id);
    res.json({ message: 'Brick sale deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
