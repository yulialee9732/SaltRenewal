# Google Sheets Integration - Quick Start

## What's Integrated?

Every form submission in your MERN app now automatically saves to Google Sheets:

✅ **Price Estimate Form** → `PriceEstimates` sheet
✅ **Service Request Form** → `ServiceRequests` sheet  
✅ **Contact Form** → `ContactForms` sheet

## Quick Setup (5 minutes)

### 1. Create Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Google Sheets API**
4. Create a **Service Account**
5. Download the JSON key file

### 2. Create Spreadsheet

1. Create a new Google Sheet: `MERN App Form Submissions`
2. Create 3 sheets: `PriceEstimates`, `ServiceRequests`, `ContactForms`
3. Copy the Spreadsheet ID from URL
4. Share spreadsheet with service account email (from JSON file)

### 3. Configure Environment

Add to your `server/.env`:

```env
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_from_url
GOOGLE_CREDENTIALS={"type":"service_account",...paste entire JSON here...}
```

### 4. Initialize Headers

```bash
cd server
npm run setup-sheets
```

### 5. Restart Server

```bash
npm start
```

## Test It

Submit any form and check your Google Sheet - you should see a new row!

## Need Help?

See [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md) for detailed instructions.

## Optional

Google Sheets integration is **optional**. If you don't configure it:
- Forms still work normally
- Data saves to MongoDB
- You'll see a warning in console (safe to ignore)
