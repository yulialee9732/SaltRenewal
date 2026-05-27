require('dotenv').config({ path: '.env' });
const { google } = require('googleapis');

(async () => {
  const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
  const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  const auth = new google.auth.GoogleAuth({
    credentials: CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'SALT 상담신청!C:C',
  });
  
  const rows = response.data.values || [];
  console.log('Total entries:', rows.length - 1);
  
  const index = rows.findIndex(r => r[0] === '010-9999-8888');
  if (index >= 0) {
    console.log('✅ Found at row:', index + 1);
    console.log('   (Row 2 would be at top, right after header)');
  } else {
    console.log('❌ 010-9999-8888 NOT FOUND in sheet');
    console.log('\nLast 5 phone numbers:');
    rows.slice(-5).forEach((r, i) => console.log('  ', r[0]));
  }
})();
