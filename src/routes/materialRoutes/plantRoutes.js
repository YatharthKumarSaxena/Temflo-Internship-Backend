const express = require('express');
const router = express.Router();
const Plant = require('../../models/appModels/Plant');
const { catchErrors } = require('@/handlers/errorHandlers');

// Get plants dropdown
router.get(
  '/dropdown',
  catchErrors(async (req, res) => {
    try {
      const plants = await Plant.find({ removed: false, enabled: true })
        .select('plantCode name')
        .sort({ name: 1 });

      res.json({
        success: true,
        data: plants,
      });
    } catch (error) {
      throw error;
    }
  })
);

module.exports = router;
