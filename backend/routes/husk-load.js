const express = require('express');
const router = express.Router();
const HuskLoad = require('../models/HuskLoad');

// GET / - List all
router.get('/', async (req, res) => {
  try {
    const loads = await HuskLoad.find().sort({ createdAt: -1 });
    res.json(loads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:id
router.get('/:id', async (req, res) => {
  try {
    const load = await HuskLoad.findById(req.params.id);
    if (!load) return res.status(404).json({ error: 'Husk load not found' });
    res.json(load);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /
router.post('/', async (req, res) => {
  try {
    const { tonnage, price_per_ton, total_amount, total_paid, received_date, supplier_name, remarks } = req.body;
    if (!tonnage || !price_per_ton || !total_amount || !received_date) {
      return res.status(400).json({ error: 'tonnage, price_per_ton, total_amount, and received_date are required' });
    }
    const paid = total_paid || 0;
    const load = new HuskLoad({
      tonnage, price_per_ton, total_amount,
      total_paid: paid,
      balance: total_amount - paid,
      received_date, supplier_name, remarks
    });
    const saved = await load.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const existing = await HuskLoad.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Husk load not found' });

    const { tonnage, price_per_ton, total_amount, total_paid, received_date, supplier_name, remarks } = req.body;
    if (tonnage !== undefined) existing.tonnage = tonnage;
    if (price_per_ton !== undefined) existing.price_per_ton = price_per_ton;
    if (total_amount !== undefined) existing.total_amount = total_amount;
    if (total_paid !== undefined) existing.total_paid = total_paid;
    if (received_date !== undefined) existing.received_date = received_date;
    if (supplier_name !== undefined) existing.supplier_name = supplier_name;
    if (remarks !== undefined) existing.remarks = remarks;
    existing.balance = existing.total_amount - existing.total_paid;

    const updated = await existing.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /:id/pay
router.post('/:id/pay', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'A positive amount is required' });
    const load = await HuskLoad.findById(req.params.id);
    if (!load) return res.status(404).json({ error: 'Husk load not found' });
    load.total_paid += amount;
    load.balance = load.total_amount - load.total_paid;
    const updated = await load.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const existing = await HuskLoad.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Husk load not found' });
    await HuskLoad.findByIdAndDelete(req.params.id);
    res.json({ message: 'Husk load deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
