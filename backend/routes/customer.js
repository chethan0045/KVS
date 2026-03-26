const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// GET / - List all customers sorted by name
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /search?q=term - Search customers by name (case insensitive) for autocomplete
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }
    const customers = await Customer.find({
      name: { $regex: q, $options: 'i' }
    }).sort({ name: 1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:id - Get one customer
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST / - Create customer
router.post('/', async (req, res) => {
  try {
    const { name, phone, address, remarks } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const customer = new Customer({ name, phone, address, remarks });
    const saved = await customer.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /:id - Update customer
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const { name, phone, address, remarks } = req.body;

    if (name !== undefined) customer.name = name;
    if (phone !== undefined) customer.phone = phone;
    if (address !== undefined) customer.address = address;
    if (remarks !== undefined) customer.remarks = remarks;

    const updated = await customer.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /:id/pay - Record a payment
router.post('/:id/pay', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'A positive amount is required' });
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    customer.total_paid += amount;
    customer.balance = customer.total_amount - customer.total_paid;

    const updated = await customer.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /:id - Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
