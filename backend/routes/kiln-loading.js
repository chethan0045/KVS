const express = require('express');
const router = express.Router();
const KilnLoading = require('../models/KilnLoading');
const Employee = require('../models/Employee');

// Add wages to employees (split equally)
async function addWagesToEmployees(employeeIds, totalWages) {
  if (!employeeIds || employeeIds.length === 0 || !totalWages) return;
  const perEmployee = totalWages / employeeIds.length;
  for (const empId of employeeIds) {
    await Employee.findByIdAndUpdate(empId, {
      $inc: { total_wages_earned: perEmployee, balance: perEmployee }
    });
  }
}

// Reverse wages from employees (split equally)
async function reverseWagesFromEmployees(employeeIds, totalWages) {
  if (!employeeIds || employeeIds.length === 0 || !totalWages) return;
  const perEmployee = totalWages / employeeIds.length;
  for (const empId of employeeIds) {
    await Employee.findByIdAndUpdate(empId, {
      $inc: { total_wages_earned: -perEmployee, balance: -perEmployee }
    });
  }
}

// GET / - List all kiln loadings with populated employee data
router.get('/', async (req, res) => {
  try {
    const loadings = await KilnLoading.find()
      .populate('employees')
      .sort({ createdAt: -1 });
    res.json(loadings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:id - Get one kiln loading
router.get('/:id', async (req, res) => {
  try {
    const loading = await KilnLoading.findById(req.params.id)
      .populate('employees');
    if (!loading) {
      return res.status(404).json({ error: 'Kiln loading not found' });
    }
    res.json(loading);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST / - Create kiln loading
router.post('/', async (req, res) => {
  try {
    const { kiln_number, quantity_loaded, employees, loading_date, status, remarks } = req.body;

    if (!kiln_number || !quantity_loaded || !loading_date) {
      return res.status(400).json({ error: 'kiln_number, quantity_loaded, and loading_date are required' });
    }

    const total_wages = quantity_loaded * 0.55;

    const loading = new KilnLoading({
      kiln_number,
      quantity_loaded,
      employees: employees || [],
      loading_date,
      status: status || 'loading',
      total_wages,
      remarks
    });

    const saved = await loading.save();

    // Add wages to employees
    await addWagesToEmployees(saved.employees, saved.total_wages);

    const populated = await saved.populate('employees');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /:id - Update kiln loading
router.put('/:id', async (req, res) => {
  try {
    const existing = await KilnLoading.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Kiln loading not found' });
    }

    // Store old values to reverse wages
    const oldEmployees = existing.employees.map(e => e.toString());
    const oldTotalWages = existing.total_wages || 0;

    const { kiln_number, quantity_loaded, employees, loading_date, status, remarks } = req.body;

    existing.kiln_number = kiln_number || existing.kiln_number;
    existing.quantity_loaded = quantity_loaded || existing.quantity_loaded;
    existing.employees = employees !== undefined ? employees : existing.employees;
    existing.loading_date = loading_date || existing.loading_date;
    existing.status = status || existing.status;
    existing.remarks = remarks !== undefined ? remarks : existing.remarks;

    // Recalculate wages
    existing.total_wages = existing.quantity_loaded * 0.55;

    const updated = await existing.save();

    // Reverse old wages from old employees, then add new wages to new employees
    await reverseWagesFromEmployees(oldEmployees, oldTotalWages);
    await addWagesToEmployees(updated.employees, updated.total_wages);

    const populated = await updated.populate('employees');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /:id/status - Update kiln status only
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['loading', 'firing', 'ready'].includes(status)) {
      return res.status(400).json({ error: 'Status must be loading, firing, or ready' });
    }
    const loading = await KilnLoading.findById(req.params.id);
    if (!loading) {
      return res.status(404).json({ error: 'Kiln loading not found' });
    }
    loading.status = status;
    const updated = await loading.save();
    const populated = await updated.populate('employees');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /:id - Delete kiln loading
router.delete('/:id', async (req, res) => {
  try {
    const existing = await KilnLoading.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Kiln loading not found' });
    }

    // Reverse wages from employees before deleting
    await reverseWagesFromEmployees(existing.employees, existing.total_wages);

    await KilnLoading.findByIdAndDelete(req.params.id);
    res.json({ message: 'Kiln loading deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
