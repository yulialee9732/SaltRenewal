const express = require('express');
const router = express.Router();
const priceEstimateController = require('../controllers/priceEstimateController');
const { protect } = require('../middleware/auth');

// Public routes - submit price estimates
router.post('/', priceEstimateController.submitPriceEstimate); // Full consultation (상담신청폼)
router.post('/quick', priceEstimateController.submitQuickEstimate); // Quick estimate (간편견적)

// Protected routes - for admin/employee to view estimates
router.get('/', protect, priceEstimateController.getAllEstimates);
router.get('/sheets', protect, priceEstimateController.getSheetEstimates); // Get data from Google Sheets
router.get('/:id', protect, priceEstimateController.getEstimateById);
router.patch('/:id/status', protect, priceEstimateController.updateEstimateStatus);

module.exports = router;
