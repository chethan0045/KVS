const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const WagePayment = require('../models/WagePayment');

// GET / - List all employees sorted by name
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ name: 1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:id - Get one employee
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST / - Create employee
router.post('/', async (req, res) => {
  try {
    const { name, phone, address, status, joining_date, remarks } = req.body;

    if (!name || !joining_date) {
      return res.status(400).json({ error: 'name and joining_date are required' });
    }

    const employee = new Employee({
      name,
      phone,
      address,
      status: status || 'active',
      joining_date,
      remarks
    });

    const saved = await employee.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /:id - Update employee
router.put('/:id', async (req, res) => {
  try {
    const existing = await Employee.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const { name, phone, address, status, joining_date, remarks } = req.body;

    existing.name = name || existing.name;
    existing.phone = phone !== undefined ? phone : existing.phone;
    existing.address = address !== undefined ? address : existing.address;
    existing.status = status || existing.status;
    existing.joining_date = joining_date || existing.joining_date;
    existing.remarks = remarks !== undefined ? remarks : existing.remarks;

    const updated = await existing.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /:id/pay - Record a payment to an employee
router.post('/:id/pay', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'A positive amount is required' });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    employee.total_paid += amount;
    employee.balance = employee.total_wages_earned - employee.total_paid;

    // Record the payment with exact timestamp
    const payment = new WagePayment({
      employee_id: employee._id,
      amount,
      paid_at: new Date()
    });

    await Promise.all([employee.save(), payment.save()]);
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /:id - Delete employee
router.delete('/:id', async (req, res) => {
  try {
    const existing = await Employee.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
