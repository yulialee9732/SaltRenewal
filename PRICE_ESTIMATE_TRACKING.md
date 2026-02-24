# Price Estimate Form Tracking Guide

## Overview
The price estimate form submissions are tracked through two systems:
1. **Email notifications** to zzoomcctv@gmail.com
2. **Database storage** in MongoDB

## Email Setup

### Step 1: Configure Gmail App Password
1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification** (enable if not already)
3. Scroll to **App passwords** at the bottom
4. Click **Select app** → Choose "Mail"
5. Click **Select device** → Choose "Other" and enter "MERN App"
6. Click **Generate**
7. Copy the 16-character password (it will look like: `xxxx xxxx xxxx xxxx`)

### Step 2: Update .env File
Create a `.env` file in the `/server` directory (copy from `.env.example`):
```
EMAIL_USER=zzoomcctv@gmail.com
EMAIL_PASSWORD=your_16_character_app_password_here
```

**Important:** Use the app password, NOT your regular Gmail password!

## Email Notification Format

When a customer submits the price estimate form, you'll receive an email with:

### Customer Information
- Phone number
- Address
- Location type (office, school, etc.)
- Internet availability

### Camera Details
- Camera type (210만, 500만, or both)
- Indoor camera count
- Outdoor camera count
- Total cameras

### Additional Options
- **IoT Options**: Selected smart sensors (fingerprint, card reader, door sensor, etc.)
- **Special Construction**: Height requirements, elevator work, special piping, etc.

### Pricing
- Base monthly price (based on camera count)
- IoT and special options marked as "시세변동" (market-dependent)

### Appointment
- Preferred installation date
- Preferred time slot

### Change Tracking
- Shows if customer modified their selections before final submission
- Displays initial vs. final selections

## Database Tracking

### View All Submissions
All submissions are stored in MongoDB in the `priceestimates` collection.

### Submission Fields
```javascript
{
  initialSelection: {
    cameraType, indoorCount, outdoorCount, 
    iotOptions[], specialOptions[]
  },
  currentSelection: {
    cameraType, indoorCount, outdoorCount,
    iotOptions[], specialOptions[]
  },
  contactInfo: {
    phoneNumber, address, locationType, hasInternet
  },
  appointment: {
    date, time
  },
  price: Number,
  submittedAt: Date,
  status: 'pending' | 'contacted' | 'scheduled' | 'completed' | 'cancelled'
}
```

### Access Submissions via API

**Get all estimates** (requires authentication):
```
GET /api/price-estimate
Headers: { Authorization: 'Bearer <token>' }
```

**Get specific estimate**:
```
GET /api/price-estimate/:id
Headers: { Authorization: 'Bearer <token>' }
```

**Update status**:
```
PATCH /api/price-estimate/:id/status
Headers: { Authorization: 'Bearer <token>' }
Body: { status: 'contacted' }
```

## Recommended Workflow

1. **Receive Email Notification**
   - Email arrives at zzoomcctv@gmail.com
   - Contains all customer details and selections

2. **Review in Database** (optional)
   - Access via employee dashboard
   - View all submissions with status tracking

3. **Contact Customer**
   - Call customer at provided phone number
   - Confirm details and appointment

4. **Update Status**
   - Mark as "contacted" after initial call
   - Mark as "scheduled" once appointment confirmed
   - Mark as "completed" after installation
   - Mark as "cancelled" if customer cancels

## Pricing Calculator

The form automatically calculates monthly pricing based on camera count:

| Cameras | Monthly Price |
|---------|---------------|
| 2       | ₩19,000      |
| 3       | ₩23,000      |
| 4       | ₩27,000      |
| 5       | ₩33,000      |
| 6       | ₩38,000      |
| 7       | ₩43,000      |
| 8       | ₩48,000      |
| 9       | ₩60,000      |
| 10      | ₩65,000      |
| 11      | ₩70,000      |
| 12      | ₩74,000      |
| 13      | ₩79,000      |
| 14      | ₩83,000      |
| 15      | ₩89,000      |
| 16      | ₩93,000      |

*IoT and special construction options are marked as "시세변동" (market-dependent pricing)*

## Calendar Features

The appointment calendar automatically:
- ✅ Shows only weekdays (Monday-Friday)
- ✅ Excludes weekends
- ✅ Blocks major Korean holidays
- ✅ Only allows future dates
- ❌ Blocks unavailable dates in gray

## Troubleshooting

### Email Not Sending
1. Check `.env` file has correct EMAIL_USER and EMAIL_PASSWORD
2. Verify app password is 16 characters without spaces
3. Check server console for error messages
4. Ensure 2-factor authentication is enabled on Gmail

### Database Not Saving
1. Verify MongoDB connection in `.env` (MONGO_URI)
2. Check server console for connection errors
3. Ensure PriceEstimate model is imported correctly

### Form Submission Errors
1. Open browser console (F12) for error messages
2. Check network tab for failed API calls
3. Verify all required fields are filled
4. Check phone number format (010-xxxx-xxxx)

## Support

For technical issues, check:
- Server logs: `/server/src/server.js`
- Email controller: `/server/src/controllers/priceEstimateController.js`
- Frontend component: `/client/src/components/Landing/PriceEstimate.js`
