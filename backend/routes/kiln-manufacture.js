const express = require('express');
const router = express.Router();
const KilnManufacture = require('../models/KilnManufacture');
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

// GET / - List all kiln manufactures with populated data
router.get('/', async (req, res) => {
  try {
    const manufactures = await KilnManufacture.find()
      .populate('kiln_loading_id')
      .populate('employees')
      .sort({ createdAt: -1 });
    res.json(manufactures);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:id - Get one kiln manufacture
router.get('/:id', async (req, res) => {
  try {
    const manufacture = await KilnManufacture.findById(req.params.id)
      .populate('kiln_loading_id')
      .populate('employees');
    if (!manufacture) {
      return res.status(404).json({ error: 'Kiln manufacture not found' });
    }
    res.json(manufacture);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST / - Create kiln manufacture
router.post('/', async (req, res) => {
  try {
    const { kiln_loading_id, quantity_manufactured, quantity_damaged, manufacture_date, quality_grade, employees, total_wages, status, remarks } = req.body;

    if (!kiln_loading_id || !manufacture_date) {
      return res.status(400).json({ error: 'kiln_loading_id and manufacture_date are required' });
    }

    const loading = await KilnLoading.findById(kiln_loading_id);
    if (!loading) {
      return res.status(404).json({ error: 'Referenced kiln loading not found' });
    }

    const manufacture = new KilnManufacture({
      kiln_loading_id,
      quantity_manufactured,
      quantity_damaged: quantity_damaged || 0,
      manufacture_date,
      quality_grade: quality_grade || 'A',
      employees: employees || [],
      total_wages: total_wages || 0,
      status: status || 'manufactured',
      remarks
    });

    const saved = await manufacture.save();

    // Add wages to employees
    await addWagesToEmployees(saved.employees, saved.total_wages);

    const populated = await saved.populate('kiln_loading_id');
    await populated.populate('employees');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /:id - Update kiln manufacture
router.put('/:id', async (req, res) => {
  try {
    const existing = await KilnManufacture.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Kiln manufacture not found' });
    }

    // Store old values to reverse wages
    const oldEmployees = existing.employees.map(e => e.toString());
    const oldTotalWages = existing.total_wages || 0;

    const { kiln_loading_id, quantity_manufactured, quantity_damaged, manufacture_date, quality_grade, employees, total_wages, status, remarks } = req.body;

    if (kiln_loading_id) {
      const loading = await KilnLoading.findById(kiln_loading_id);
      if (!loading) {
        return res.status(404).json({ error: 'Referenced kiln loading not found' });
      }
    }

    existing.kiln_loading_id = kiln_loading_id !== undefined ? kiln_loading_id : existing.kiln_loading_id;
    existing.quantity_manufactured = quantity_manufactured || existing.quantity_manufactured;
    existing.quantity_damaged = quantity_damaged !== undefined ? quantity_damaged : existing.quantity_damaged;
    existing.manufacture_date = manufacture_date || existing.manufacture_date;
    existing.quality_grade = quality_grade || existing.quality_grade;
    existing.employees = employees !== undefined ? employees : existing.employees;
    existing.status = status || existing.status;
    existing.remarks = remarks !== undefined ? remarks : existing.remarks;

    // Use manually entered wages
    existing.total_wages = total_wages !== undefined ? total_wages : existing.total_wages;

    const updated = await existing.save();

    // Reverse old wages from old employees, then add new wages to new employees
    await reverseWagesFromEmployees(oldEmployees, oldTotalWages);
    await addWagesToEmployees(updated.employees, updated.total_wages);

    const populated = await updated.populate('kiln_loading_id');
    await populated.populate('employees');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /:id - Delete kiln manufacture
router.delete('/:id', async (req, res) => {
  try {
    const existing = await KilnManufacture.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Kiln manufacture not found' });
    }

    // Reverse wages from employees before deleting
    await reverseWagesFromEmployees(existing.employees, existing.total_wages);

    await KilnManufacture.findByIdAndDelete(req.params.id);
    res.json({ message: 'Kiln manufacture deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
