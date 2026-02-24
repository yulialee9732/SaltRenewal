// Verify that 간편견적 entries are being saved with top insertion
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { google } = require('googleapis');

const verifyQuickEstimate = async () => {
  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
    const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    const auth = new google.auth.GoogleAuth({
      credentials: CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📊 Fetching top 5 entries from 간편견적...\n');

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: '간편견적!A1:N6', // Headers + top 5 entries
    });

    const rows = response.data.values || [];
    
    if (rows.length === 0) {
      console.log('No data found.');
      return;
    }

    console.log('Header:', rows[0].join(' | '));
    console.log('─'.repeat(120));
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      console.log(`\nRow ${i + 1}:`);
      console.log(`  IP: ${row[0]}`);
      console.log(`  시간: ${row[1]}`);
      console.log(`  실내: ${row[2]}, 실외: ${row[3]}`);
      console.log(`  IoT: ${row[4]}`);
      console.log(`  특수공사: ${row[5]}`);
      console.log(`  전환: ${row[6]}`);
      console.log(`  연락처: ${row[7] || '(없음)'}`);
    }

    console.log('\n✅ New entries should appear at Row 2 (top)');
    console.log('💡 When users click "견적 확인하기", an entry is saved to 간편견적');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

verifyQuickEstimate();
