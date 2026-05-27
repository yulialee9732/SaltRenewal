// Verify the top 3 entries in the SALT 상담신청 sheet
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { google } = require('googleapis');

const verifyTopEntries = async () => {
  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
    const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    const auth = new google.auth.GoogleAuth({
      credentials: CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📊 Fetching top 3 entries from SALT 상담신청...\n');

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'SALT 상담신청!A1:E4', // Headers + top 3 entries
    });

    const rows = response.data.values || [];
    
    if (rows.length === 0) {
      console.log('No data found.');
      return;
    }

    console.log('Header:', rows[0].join(' | '));
    console.log('─'.repeat(80));
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      console.log(`Row ${i + 1}:`);
      console.log(`  IP: ${row[0]}`);
      console.log(`  시간: ${row[1]}`);
      console.log(`  연락처: ${row[2]}`);
      console.log(`  주소: ${row[3]}`);
      console.log(`  타입: ${row[4]}`);
      console.log('');
    }

    console.log('✅ The MOST RECENT entry should be in Row 2 (at the top)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

verifyTopEntries();
