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
    const { kiln_loading_id, kiln_number, remarks } = req.body;

    if (!kiln_loading_id && !kiln_number) {
      return res.status(400).json({ error: 'kiln_loading_id or kiln_number is required' });
    }

    // Find all kiln loadings for this kiln
    let kilnLoadings;
    if (kiln_number) {
      kilnLoadings = await KilnLoading.find({ kiln_number }).populate('employees', 'name phone');
    } else {
      const single = await KilnLoading.findById(kiln_loading_id).populate('employees', 'name phone');
      if (!single) return res.status(404).json({ error: 'Kiln loading not found' });
      kilnLoadings = await KilnLoading.find({ kiln_number: single.kiln_number }).populate('employees', 'name phone');
    }

    if (kilnLoadings.length === 0) {
      return res.status(404).json({ error: 'No kiln loadings found' });
    }

    const kilnNum = kilnLoadings[0].kiln_number;
    const loadingIds = kilnLoadings.map(kl => kl._id);

    // Aggregate kiln loading data
    const totalLoaded = kilnLoadings.reduce((s, kl) => s + (kl.quantity_loaded || 0), 0);
    const totalSold = kilnLoadings.reduce((s, kl) => s + (kl.quantity_sold || 0), 0);
    const totalWages = kilnLoadings.reduce((s, kl) => s + (kl.total_wages || 0), 0);

    // Get all manufactures and sales for all loadings of this kiln
    const manufactures = await KilnManufacture.find({ kiln_loading_id: { $in: loadingIds } })
      .populate('employees', 'name phone');

    const sales = await BrickSale.find({ kiln_loading_id: { $in: loadingIds } })
      .populate('customer_id', 'name phone')
      .populate('driver_id', 'name')
      .populate('helper_id', 'name');

    // Create archive with aggregated loading
    const archive = new Archive({
      kiln_number: kilnNum,
      kiln_loading: {
        kiln_number: kilnNum,
        quantity_loaded: totalLoaded,
        quantity_sold: totalSold,
        total_wages: totalWages,
        status: kilnLoadings[0].status,
        employees: kilnLoadings.flatMap(kl => kl.employees || []),
        loading_entries: kilnLoadings.map(kl => kl.toObject())
      },
      manufactures: manufactures.map(m => m.toObject()),
      sales: sales.map(s => s.toObject()),
      remarks
    });

    await archive.save();

    // Delete original records
    await BrickSale.deleteMany({ kiln_loading_id: { $in: loadingIds } });
    await KilnManufacture.deleteMany({ kiln_loading_id: { $in: loadingIds } });
    await KilnLoading.deleteMany({ _id: { $in: loadingIds } });

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
