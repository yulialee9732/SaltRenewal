# Email Notification Setup Guide

## Overview
The system now sends email notifications to `leeyulia150@gmail.com` whenever:
- Google Sheets updates fail
- Database (MongoDB) updates fail
- Any errors occur with form submissions

## Gmail App Password Setup

To enable email notifications, you need to set up a Gmail App Password:

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security**
3. Under "Signing in to Google," select **2-Step Verification**
4. Follow the steps to enable it

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other (Custom name)**
4. Name it: "Salt Renewal MERN App"
5. Click **Generate**
6. Copy the 16-character password (remove spaces)

### Step 3: Update .env File
Open `server/.env` and update:

```env
EMAIL_USER=zzoomcctv@gmail.com
EMAIL_PASSWORD=your_16_character_app_password_here
ADMIN_EMAIL=leeyulia150@gmail.com
```

Replace `your_16_character_app_password_here` with the password from Step 2.

### Step 4: Restart Server
```bash
cd server
npm run dev
```

You should see:
```
✅ Email service initialized
```

## How It Works

### Google Sheets Priority
- **Google Sheets always updates first**, even if the database fails
- This ensures all submissions are recorded in Google Sheets
- Database errors won't prevent Google Sheets updates

### Email Notifications
When errors occur, you'll receive emails with:
- **Error Type** (Google Sheets error, Database error, etc.)
- **Error Message** (detailed description)
- **Timestamp** (Korean timezone)
- **IP Address** (submitter's IP)
- **Form Type** (간편견적, 상담신청, Service Request, etc.)
- **Contact Info** (phone number or email)
- **Stack Trace** (for debugging)

### Example Scenarios

#### Scenario 1: Database Fails
1. User submits form
2. ✅ Google Sheets updated successfully
3. ❌ Database update fails
4. 📧 Email sent to leeyulia150@gmail.com
5. ✅ User still sees success message (data is in Google Sheets)

#### Scenario 2: Google Sheets Fails
1. User submits form
2. ✅ Database updated successfully
3. ❌ Google Sheets update fails
4. 📧 Email sent to leeyulia150@gmail.com
5. User sees success message

#### Scenario 3: Everything Works
1. User submits form
2. ✅ Google Sheets updated
3. ✅ Database updated
4. ❌ No email sent (no errors)
5. User sees success message

## Testing Email Notifications

You can test the email system by temporarily breaking the database connection or Google Sheets credentials.

## Troubleshooting

### "Email credentials not configured"
- Check that `EMAIL_USER` and `EMAIL_PASSWORD` are set in `.env`
- Make sure you're using an App Password, not your regular Gmail password

### Not receiving emails
- Check spam folder
- Verify `ADMIN_EMAIL` is set to `leeyulia150@gmail.com`
- Check server logs for email sending errors
- Ensure your Gmail account allows "Less secure app access" or uses App Passwords

### Gmail blocks emails
- Use App Passwords (recommended)
- Or enable "Less secure app access" at: https://myaccount.google.com/lesssecureapps

## Email Configuration Variables

```env
# Gmail account to send emails FROM
EMAIL_USER=zzoomcctv@gmail.com

# Gmail App Password (16 characters, no spaces)
EMAIL_PASSWORD=your_app_password_here

# Email address to send error notifications TO
ADMIN_EMAIL=leeyulia150@gmail.com
```

## Production Deployment

When deploying to production (Netlify Functions, Render, etc.), make sure to set these environment variables in your hosting platform's dashboard.
