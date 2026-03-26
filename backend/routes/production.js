const express = require('express');
const router = express.Router();
const BrickProduction = require('../models/BrickProduction');
const Employee = require('../models/Employee');

const WAGE_RATE = 1.1;

// Add wages to employee
async function addWagesToEmployee(employeeId, quantity) {
  if (!employeeId || !quantity) return;
  const wages = quantity * WAGE_RATE;
  await Employee.findByIdAndUpdate(employeeId, {
    $inc: { total_wages_earned: wages, balance: wages }
  });
}

// Reverse wages from employee
async function reverseWagesFromEmployee(employeeId, quantity) {
  if (!employeeId || !quantity) return;
  const wages = quantity * WAGE_RATE;
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
    const { batch_number, quantity, production_date, employee_id, status, remarks } = req.body;

    if (!batch_number || !quantity || !production_date) {
      return res.status(400).json({ error: 'batch_number, quantity, and production_date are required' });
    }

    const production = new BrickProduction({
      batch_number,
      quantity,
      production_date,
      employee_id,
      status: status || 'produced',
      remarks
    });

    const saved = await production.save();

    // Add wages to employee
    if (saved.employee_id) {
      await addWagesToEmployee(saved.employee_id, saved.quantity);
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

    // Store old values to reverse wages
    const oldEmployeeId = existing.employee_id ? existing.employee_id.toString() : null;
    const oldQuantity = existing.quantity;

    const { batch_number, quantity, production_date, employee_id, status, remarks } = req.body;

    existing.batch_number = batch_number || existing.batch_number;
    existing.quantity = quantity || existing.quantity;
    existing.production_date = production_date || existing.production_date;
    existing.employee_id = employee_id !== undefined ? employee_id : existing.employee_id;
    existing.status = status || existing.status;
    existing.remarks = remarks !== undefined ? remarks : existing.remarks;

    const updated = await existing.save();

    // Reverse old wages, add new wages
    if (oldEmployeeId) {
      await reverseWagesFromEmployee(oldEmployeeId, oldQuantity);
    }
    if (updated.employee_id) {
      await addWagesToEmployee(updated.employee_id, updated.quantity);
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
      await reverseWagesFromEmployee(existing.employee_id, existing.quantity);
    }

    await BrickProduction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Production deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
