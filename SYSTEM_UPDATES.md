# System Updates - Always Record to Google Sheets + Email Notifications

## ✅ What Was Implemented

### 1. Google Sheets Priority System
- **Google Sheets ALWAYS updates first**, before database
- Even if MongoDB (dashboard) fails, Google Sheets will be updated
- This ensures NO data is ever lost

### 2. Email Notifications on Errors
- System sends emails to `leeyulia150@gmail.com` when:
  - ❌ Google Sheets update fails
  - ❌ Database (MongoDB) update fails
  - ❌ Any error occurs during form submission

### 3. Error Details in Emails
Each error notification email includes:
- Error type and message
- Timestamp (Korean timezone)
- IP address
- Form type (간편견적, 상담신청, etc.)
- Contact information
- Full stack trace for debugging

### 4. Updated Controllers
All form submission endpoints now:
1. Update Google Sheets FIRST
2. Then update database
3. Send email if either fails
4. Still return success to user if Google Sheets succeeded

Updated files:
- ✅ `priceEstimateController.js` - 간편견적 & 상담신청
- ✅ `serviceRequestController.js` - Service requests
- ✅ `contactFormController.js` - Contact forms

### 5. New Email Service
Created `server/src/services/emailService.js`:
- `initializeEmail()` - Sets up Gmail transporter
- `sendErrorNotification()` - Sends detailed error emails
- `sendSuccessNotification()` - Optional success notifications

## 🔧 Setup Required

### Gmail App Password
You need to set up a Gmail App Password to enable email notifications:

1. **Enable 2-Factor Authentication**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Create password for "Mail" → "Other (Custom name)"
   - Name it: "Salt Renewal MERN App"
   - Copy the 16-character password

3. **Update .env File**
   ```env
   EMAIL_USER=zzoomcctv@gmail.com
   EMAIL_PASSWORD=paste_your_16_character_password_here
   ADMIN_EMAIL=leeyulia150@gmail.com
   ```

4. **Restart Server**
   ```bash
   cd server
   npm run dev
   ```

   You should see:
   ```
   ✅ Email service initialized
   ```

## 📊 How It Works

### Submission Flow

```
User submits form
    ↓
1. Extract data & IP address
    ↓
2. ✅ Update Google Sheets (ALWAYS FIRST)
    ↓
3. Try to save to MongoDB database
    ↓
4. If MongoDB fails:
   - 📧 Send email to leeyulia150@gmail.com
   - ✅ Still return success (data is in Google Sheets)
    ↓
5. If Google Sheets fails:
   - 📧 Send email to leeyulia150@gmail.com
   - ⚠️ Log error but continue
```

### Example Scenarios

**Scenario 1: Everything works perfectly**
- ✅ Google Sheets updated
- ✅ MongoDB updated
- ✅ User sees success
- ❌ NO email sent

**Scenario 2: Database fails**
- ✅ Google Sheets updated
- ❌ MongoDB failed
- ✅ User sees success
- 📧 Email sent to leeyulia150@gmail.com

**Scenario 3: Google Sheets fails**
- ❌ Google Sheets failed
- ✅ MongoDB updated (or failed)
- ✅ User sees success
- 📧 Email sent to leeyulia150@gmail.com

## 📁 Files Modified

### New Files
- `server/src/services/emailService.js` - Email notification service
- `EMAIL_SETUP.md` - Detailed setup instructions
- `SYSTEM_UPDATES.md` - This file

### Modified Files
- `server/src/server.js` - Initialize email service
- `server/src/services/googleSheets.js` - Add email notifications on errors
- `server/src/controllers/priceEstimateController.js` - Update 간편견적 & 상담신청 logic
- `server/src/controllers/serviceRequestController.js` - Update service request logic
- `server/src/controllers/contactFormController.js` - Update contact form logic
- `server/.env` - Add ADMIN_EMAIL configuration

### Dependencies Added
- `nodemailer@^6.9.x` - For sending emails via Gmail

## ✅ Testing

### Test 간편견적 Recording
Currently, 간편견적 (quick estimates) are now:
1. ✅ Updating Google Sheets
2. ✅ Saving to MongoDB
3. ✅ Recording with type='quick', converted=false
4. ✅ Recording with 전환(O/X) = 'X' in Google Sheets

You can verify by:
1. Click "다시 견적 내기" button on the website
2. Check Google Sheets "간편견적" tab
3. New row should appear with:
   - Your IP address
   - Current timestamp
   - Camera counts
   - IoT/Special options (Korean names)
   - 전환(O/X) = X
   - Empty contact info
   - Empty date/time

### Test Email Notifications (After Setup)
To test email notifications:
1. Set up Gmail App Password (see above)
2. Temporarily break MongoDB connection in `.env`
3. Submit a form
4. Check `leeyulia150@gmail.com` for error notification

## 🚀 Current Status

- ✅ Google Sheets priority system implemented
- ✅ Email notification service created
- ✅ All controllers updated
- ✅ Error handling improved
- ⏳ **EMAIL SETUP PENDING** - Needs Gmail App Password
- ✅ Server running on port 5001
- ✅ 간편견적 endpoint working
- ✅ 상담신청 endpoint working

## 📝 Next Steps

1. **Set up Gmail App Password** (see EMAIL_SETUP.md)
2. **Test email notifications** by submitting forms
3. **Verify Google Sheets** receives all submissions
4. **Monitor emails** at leeyulia150@gmail.com for any errors

## 🔗 Documentation

- Full email setup guide: `EMAIL_SETUP.md`
- Price estimate tracking: `PRICE_ESTIMATE_TRACKING.md`
- General README: `README.md`
