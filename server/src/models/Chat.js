const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    enum: ['user', 'employee'],
    required: true
  },
  employeeName: {
    type: String,
    default: ''
  },
  read: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  customerName: {
    type: String,
    default: '고객'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'ended'],
    default: 'pending'
  },
  messages: [messageSchema],
  acceptedBy: {
    type: String,
    default: ''
  },
  acceptedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  },
  endedBy: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUpdate: {
    type: Date,
    default: Date.now
  }
});

// Update lastUpdate on save
chatSchema.pre('save', function(next) {
  this.lastUpdate = new Date();
  next();
});

module.exports = mongoose.model('Chat', chatSchema);
