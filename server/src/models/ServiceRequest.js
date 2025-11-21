const mongoose = require('mongoose');

const editHistorySchema = new mongoose.Schema({
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  editedAt: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String,
    required: true
  },
  previousStatus: String,
  newStatus: String
});

const serviceRequestSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: [true, 'Please add a subject'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    trim: true
  },
  category: {
    type: String,
    enum: ['warranty', 'repair', 'replacement', 'consultation', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'closed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  productInfo: {
    name: String,
    serialNumber: String,
    purchaseDate: Date
  },
  editHistory: [editHistorySchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
serviceRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
