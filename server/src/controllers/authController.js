const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { sendEmployeeRegistrationRequest } = require('../services/emailService');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Verify employee code
// @route   POST /api/auth/verify-employee-code
// @access  Public
exports.verifyEmployeeCode = async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ valid: false, message: '코드를 입력해주세요' });
  const isValid = code === process.env.EMPLOYEE_CODE;
  return res.json({ valid: isValid });
};

// @desc    Check username availability
// @route   POST /api/auth/check-username
// @access  Public
exports.checkUsername = async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const userExists = await User.findOne({ username: username.toLowerCase() });
    
    res.json({ available: !userExists });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, username, email, password, role, phone, employeeCode } = req.body;

    // Verify employee code when registering as employee
    if (role === 'employee' && employeeCode !== process.env.EMPLOYEE_CODE) {
      return res.status(403).json({ message: '직원 인증 코드가 올바르지 않습니다.' });
    }

    // Check if user exists
    const userExists = await User.findOne({ username: username.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create user — employees start as 'pending' until admin approves
    const user = await User.create({
      name,
      username: username.toLowerCase(),
      email,
      password,
      role: role || 'customer',
      status: role === 'employee' ? 'pending' : 'active',
      phone
    });

    if (user) {
      // If employee registration, send notification email and return pending status (no token)
      if (role === 'employee') {
        await sendEmployeeRegistrationRequest({ name: user.name, username: user.username, phone: user.phone });
        return res.status(202).json({
          pending: true,
          message: '가입 요청이 접수되었습니다. 관리자 승인 후 로그인하실 수 있습니다.'
        });
      }
      res.status(201).json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate username and password
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Check for user (include password for comparison)
    const user = await User.findOne({ username: username.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Block pending employees
    if (user.role === 'employee' && user.status === 'pending') {
      return res.status(403).json({ message: '승인 대기 중입니다. 관리자의 승인 후 로그인할 수 있습니다.' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      phone: user.phone,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get pending employee registrations
// @route   GET /api/auth/pending-employees
// @access  Private (employee)
exports.getPendingEmployees = async (req, res) => {
  try {
    const pending = await User.find({ role: 'employee', status: 'pending' }).select('-password');
    res.json(pending);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Approve a pending employee
// @route   PUT /api/auth/approve-employee/:id
// @access  Private (employee)
exports.approveEmployee = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: `${user.name} 승인 완료`, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reject (delete) a pending employee
// @route   DELETE /api/auth/reject-employee/:id
// @access  Private (employee)
exports.rejectEmployee = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: `${user.name} 거절 완료` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    user.password = req.body.newPassword;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
