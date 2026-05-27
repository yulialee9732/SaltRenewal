require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { google } = require('googleapis');

async function deleteOldSheets() {
  const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
  const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);

  const auth = new google.auth.GoogleAuth({
    credentials: CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // Delete the old sheets: PriceEstimates, ServiceRequests, ContactForms
    // Sheet IDs from list-sheets.js output:
    // PriceEstimates (ID: 0)
    // ServiceRequests (ID: 1263341579)
    // ContactForms (ID: 1905584604)
    
    const requests = [
      {
        deleteSheet: {
          sheetId: 1263341579 // ServiceRequests
        }
      },
      {
        deleteSheet: {
          sheetId: 1905584604 // ContactForms
        }
      },
      {
        deleteSheet: {
          sheetId: 0 // PriceEstimates
        }
      }
    ];

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: requests
      }
    });

    console.log('✅ Deleted old sheets: PriceEstimates, ServiceRequests, ContactForms');
    console.log('✅ Remaining sheets: 간편견적, 상담신청');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

deleteOldSheets();
