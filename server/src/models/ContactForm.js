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

const contactFormSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  phone: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Please add a subject'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Please add a message'],
    trim: true
  },
  status: {
    type: String,
    enum: ['new', 'read', 'in-progress', 'resolved'],
    default: 'new'
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
contactFormSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ContactForm', contactFormSchema);
