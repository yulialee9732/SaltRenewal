const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const { initializeSheets } = require('./services/googleSheets');
const { initializeEmail } = require('./services/emailService');
const { scheduleDailyEmail } = require('./services/dailyEmailScheduler');

// Load environment variables from the server root directory
const envPath = path.join(__dirname, '..', '.env');
console.log('📁 Loading .env from:', envPath);
console.log('📁 File exists:', require('fs').existsSync(envPath));
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('❌ Error loading .env:', result.error);
} else {
  console.log('✅ .env loaded successfully');
  console.log('✅ GOOGLE_SPREADSHEET_ID:', process.env.GOOGLE_SPREADSHEET_ID ? 'Found' : 'Missing');
}

const app = express();

// Connect Database
connectDB();

// Initialize Google Sheets (async, non-blocking)
initializeSheets().catch(err => console.error('Google Sheets initialization failed:', err.message));

// Initialize Email Service (async, non-blocking)
initializeEmail();

// Initialize Daily Email Scheduler (7:00 AM NC time)
scheduleDailyEmail();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/price-estimate', require('./routes/priceEstimates'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});