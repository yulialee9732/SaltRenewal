const mongoose = require('mongoose');

const priceEstimateSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['quick', 'full'], // 'quick' = 간편견적, 'full' = 상담신청폼
    required: true
  },
  converted: {
    type: Boolean,
    default: false // true = O, false = X in 전환 column
  },
  initialSelection: {
    cameraType: String,
    indoorCount: Number,
    outdoorCount: Number,
    iotOptions: [String],
    specialOptions: [String]
  },
  currentSelection: {
    cameraType: String,
    indoorCount: Number,
    outdoorCount: Number,
    iotOptions: [String],
    specialOptions: [String]
  },
  contactInfo: {
    phoneNumber: String,
    address: String,
    locationType: String,
    hasInternet: String
  },
  appointment: {
    date: Date,
    time: String
  },
  price: Number,
  ipAddress: {
    type: String,
    required: false
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'scheduled', 'completed', 'cancelled'],
    default: 'pending'
  }
});

module.exports = mongoose.model('PriceEstimate', priceEstimateSchema);
