const express = require('express');
const router = express.Router();
const WageSetting = require('../models/WageSetting');

const RATE_FIELDS = [
  'production_rate', 'kiln_loading_rate', 'driver_wage', 'helper_wage',
  'husk_loading_wage', 'dba_wage', 'wall_wage', 'cleaning_wage'
];

// GET / - Current wage settings (created with defaults on first call)
router.get('/', async (req, res) => {
  try {
    const settings = await WageSetting.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT / - Update wage settings (new rates apply only to records created afterwards)
router.put('/', async (req, res) => {
  try {
    const settings = await WageSetting.getSettings();
    for (const field of RATE_FIELDS) {
      if (req.body[field] !== undefined) {
        const value = Number(req.body[field]);
        if (isNaN(value) || value < 0) {
          return res.status(400).json({ error: `${field} must be a non-negative number` });
        }
        settings[field] = value;
      }
    }
    const saved = await settings.save();
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
