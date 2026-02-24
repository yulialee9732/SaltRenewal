const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  checkUsername,
  verifyEmployeeCode,
  getPendingEmployees,
  approveEmployee,
  rejectEmployee
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Validation middleware
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('role').optional().isIn(['customer', 'employee']).withMessage('Invalid role')
];

const loginValidation = [
  body('username').trim().notEmpty().withMessage('Please provide a username'),
  body('password').notEmpty().withMessage('Password is required')
];

// Public routes
router.post('/check-username', checkUsername);
router.post('/verify-employee-code', verifyEmployeeCode);
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.get('/pending-employees', protect, getPendingEmployees);
router.put('/approve-employee/:id', protect, approveEmployee);
router.delete('/reject-employee/:id', protect, rejectEmployee);

module.exports = router;
