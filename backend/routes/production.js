const express = require('express');
const router = express.Router();
const BrickProduction = require('../models/BrickProduction');
const Employee = require('../models/Employee');
const WageSetting = require('../models/WageSetting');

// Add wages to employee (rate comes from the record's captured wage_rate)
async function addWagesToEmployee(employeeId, quantity, rate) {
  if (!employeeId || !quantity) return;
  const wages = quantity * rate;
  await Employee.findByIdAndUpdate(employeeId, {
    $inc: { total_wages_earned: wages, balance: wages }
  });
}

// Reverse wages from employee
async function reverseWagesFromEmployee(employeeId, quantity, rate) {
  if (!employeeId || !quantity) return;
  const wages = quantity * rate;
  await Employee.findByIdAndUpdate(employeeId, {
    $inc: { total_wages_earned: -wages, balance: -wages }
  });
}

// GET / - List all productions
router.get('/', async (req, res) => {
  try {
    const productions = await BrickProduction.find()
      .populate('employee_id')
      .sort({ createdAt: -1 });
    res.json(productions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:id - Get one production
router.get('/:id', async (req, res) => {
  try {
    const production = await BrickProduction.findById(req.params.id)
      .populate('employee_id');
    if (!production) {
      return res.status(404).json({ error: 'Production not found' });
    }
    res.json(production);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST / - Create production
router.post('/', async (req, res) => {
  try {
    const { batch_number, quantity, sections, production_date, employee_id, status, remarks } = req.body;

    if (!quantity || !production_date) {
      return res.status(400).json({ error: 'quantity and production_date are required' });
    }

    const settings = await WageSetting.getSettings();

    const production = new BrickProduction({
      batch_number: batch_number || undefined,
      quantity,
      sections: sections || [],
      production_date,
      employee_id,
      wage_rate: settings.production_rate,
      status: status || 'produced',
      remarks
    });

    const saved = await production.save();

    // Add wages to employee
    if (saved.employee_id) {
      await addWagesToEmployee(saved.employee_id, saved.quantity, saved.wage_rate);
    }

    const populated = await saved.populate('employee_id');
    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Batch number already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT /:id - Update production
router.put('/:id', async (req, res) => {
  try {
    const existing = await BrickProduction.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Production not found' });
    }

    // Store old values to reverse wages (record keeps its captured rate on edits)
    const oldEmployeeId = existing.employee_id ? existing.employee_id.toString() : null;
    const oldQuantity = existing.quantity;
    const wageRate = existing.wage_rate ?? 1.2;

    const { batch_number, quantity, sections, production_date, employee_id, status, remarks } = req.body;

    existing.batch_number = batch_number !== undefined ? batch_number : existing.batch_number;
    existing.quantity = quantity || existing.quantity;
    existing.sections = sections !== undefined ? sections : existing.sections;
    existing.production_date = production_date || existing.production_date;
    existing.employee_id = employee_id !== undefined ? employee_id : existing.employee_id;
    existing.status = status || existing.status;
    existing.remarks = remarks !== undefined ? remarks : existing.remarks;

    const updated = await existing.save();

    // Reverse old wages, add new wages
    if (oldEmployeeId) {
      await reverseWagesFromEmployee(oldEmployeeId, oldQuantity, wageRate);
    }
    if (updated.employee_id) {
      await addWagesToEmployee(updated.employee_id, updated.quantity, wageRate);
    }

    const populated = await updated.populate('employee_id');
    res.json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Batch number already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /:id - Delete production
router.delete('/:id', async (req, res) => {
  try {
    const existing = await BrickProduction.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Production not found' });
    }

    // Reverse wages from employee before deleting
    if (existing.employee_id) {
      await reverseWagesFromEmployee(existing.employee_id, existing.quantity, existing.wage_rate ?? 1.2);
    }

    await BrickProduction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Production deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
