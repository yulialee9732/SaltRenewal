const express = require('express');
const router = express.Router();
const {
  createContactForm,
  getContactForms,
  getContactForm,
  updateContactForm,
  deleteContactForm
} = require('../controllers/contactFormController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getContactForms)
  .post(authorize('customer'), createContactForm);

router.route('/:id')
  .get(getContactForm)
  .put(authorize('employee'), updateContactForm)
  .delete(authorize('employee'), deleteContactForm);

module.exports = router;
