// Find the test entry with phone 010-9999-8888
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { google } = require('googleapis');

const findTestEntry = async () => {
  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
    const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    const auth = new google.auth.GoogleAuth({
      credentials: CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('🔍 Searching for test entry (010-9999-8888)...\n');

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'SALT 상담신청!A1:M10', // Get first 10 rows
    });

    const rows = response.data.values || [];
    
    console.log(`Total rows fetched: ${rows.length}\n`);
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const phone = row[2]; // Column C: 연락처
      
      if (i === 0) {
        console.log('Headers:', row.join(' | '));
        console.log('─'.repeat(100));
        continue;
      }
      
      console.log(`Row ${i + 1}:`);
      console.log(`  시간: ${row[1]}`);
      console.log(`  연락처: ${phone}`);
      console.log(`  주소: ${row[3]}`);
      
      if (phone === '010-9999-8888') {
        console.log('  ✅ FOUND TEST ENTRY!');
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

findTestEntry();
