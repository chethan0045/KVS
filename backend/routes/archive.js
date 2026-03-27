const express = require('express');
const router = express.Router();
const Archive = require('../models/Archive');
const KilnLoading = require('../models/KilnLoading');
const KilnManufacture = require('../models/KilnManufacture');
const BrickSale = require('../models/BrickSale');

// GET / - List all archives
router.get('/', async (req, res) => {
  try {
    const archives = await Archive.find().sort({ archived_date: -1 });
    res.json(archives);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /:id - Get one archive with full data
router.get('/:id', async (req, res) => {
  try {
    const archive = await Archive.findById(req.params.id);
    if (!archive) return res.status(404).json({ error: 'Archive not found' });
    res.json(archive);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST / - Archive a kiln loading and all related data
router.post('/', async (req, res) => {
  try {
    const { kiln_loading_id, remarks } = req.body;

    if (!kiln_loading_id) {
      return res.status(400).json({ error: 'kiln_loading_id is required' });
    }

    // Get kiln loading with populated employees
    const kilnLoading = await KilnLoading.findById(kiln_loading_id).populate('employees', 'name phone');
    if (!kilnLoading) {
      return res.status(404).json({ error: 'Kiln loading not found' });
    }

    // Get all manufactures for this kiln loading
    const manufactures = await KilnManufacture.find({ kiln_loading_id })
      .populate('employees', 'name phone');

    // Get all sales for this kiln loading
    const sales = await BrickSale.find({ kiln_loading_id })
      .populate('customer_id', 'name phone')
      .populate('driver_id', 'name')
      .populate('helper_id', 'name');

    // Create archive
    const archive = new Archive({
      kiln_number: kilnLoading.kiln_number,
      kiln_loading: kilnLoading.toObject(),
      manufactures: manufactures.map(m => m.toObject()),
      sales: sales.map(s => s.toObject()),
      remarks
    });

    await archive.save();

    // Delete original records
    await BrickSale.deleteMany({ kiln_loading_id });
    await KilnManufacture.deleteMany({ kiln_loading_id });
    await KilnLoading.findByIdAndDelete(kiln_loading_id);

    res.status(201).json(archive);
  } catch (error) {
    console.error('Archive error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /:id - Delete an archive
router.delete('/:id', async (req, res) => {
  try {
    const archive = await Archive.findByIdAndDelete(req.params.id);
    if (!archive) return res.status(404).json({ error: 'Archive not found' });
    res.json({ message: 'Archive deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
