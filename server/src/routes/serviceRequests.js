const express = require('express');
const router = express.Router();
const {
  createServiceRequest,
  getServiceRequests,
  getServiceRequest,
  updateServiceRequest,
  deleteServiceRequest
} = require('../controllers/serviceRequestController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getServiceRequests)
  .post(authorize('customer'), createServiceRequest);

router.route('/:id')
  .get(getServiceRequest)
  .put(updateServiceRequest)
  .delete(authorize('employee'), deleteServiceRequest);

module.exports = router;
