// Check conversion rate from Google Sheets
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { google } = require('googleapis');

const getConversionRate = async () => {
  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
    const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    const auth = new google.auth.GoogleAuth({
      credentials: CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📊 CONVERSION RATE REPORT - 간편견적\n');
    console.log('═'.repeat(60));

    // Fetch all entries from 간편견적
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: '간편견적!A2:N1000', // All data rows
    });

    const rows = response.data.values || [];
    
    if (rows.length === 0) {
      console.log('No data found.');
      return;
    }

    // Count conversions
    let totalEntries = 0;
    let converted = 0;
    let notConverted = 0;
    let withContact = 0;
    let withoutContact = 0;

    rows.forEach(row => {
      const conversion = row[6]; // Column G: 전환(O/X)
      const phoneNumber = row[7]; // Column H: 연락처
      
      if (conversion) {
        totalEntries++;
        if (conversion === 'O') {
          converted++;
        } else if (conversion === 'X') {
          notConverted++;
        }
      }
      
      if (phoneNumber && phoneNumber.trim() !== '') {
        withContact++;
      } else {
        withoutContact++;
      }
    });

    const conversionRate = totalEntries > 0 ? (converted / totalEntries * 100).toFixed(2) : 0;

    console.log('\n📈 Overall Statistics:');
    console.log('─'.repeat(60));
    console.log(`   Total Entries:        ${totalEntries}`);
    console.log(`   Converted (전환: O):   ${converted} entries`);
    console.log(`   Not Converted (X):    ${notConverted} entries`);
    console.log(`   \n   CONVERSION RATE:      ${conversionRate}% 🎯`);
    
    console.log('\n📞 Contact Information:');
    console.log('─'.repeat(60));
    console.log(`   With Phone Number:    ${withContact} entries`);
    console.log(`   Without Phone:        ${withoutContact} entries`);

    // Time-based analysis (last 7 days, last 30 days)
    const now = new Date();
    const last7Days = new Date(now);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(now);
    last30Days.setDate(last30Days.getDate() - 30);

    let converted7d = 0, total7d = 0;
    let converted30d = 0, total30d = 0;

    rows.forEach(row => {
      const timeStr = row[1]; // Column B: 시간
      const conversion = row[6]; // Column G: 전환(O/X)
      
      if (timeStr && conversion) {
        const entryDate = new Date(timeStr);
        
        if (entryDate >= last7Days) {
          total7d++;
          if (conversion === 'O') converted7d++;
        }
        
        if (entryDate >= last30Days) {
          total30d++;
          if (conversion === 'O') converted30d++;
        }
      }
    });

    const rate7d = total7d > 0 ? (converted7d / total7d * 100).toFixed(2) : 0;
    const rate30d = total30d > 0 ? (converted30d / total30d * 100).toFixed(2) : 0;

    console.log('\n📅 Recent Performance:');
    console.log('─'.repeat(60));
    console.log(`   Last 7 Days:          ${converted7d}/${total7d} (${rate7d}%)`);
    console.log(`   Last 30 Days:         ${converted30d}/${total30d} (${rate30d}%)`);

    console.log('\n═'.repeat(60));
    console.log('\n💡 Tips:');
    console.log('   • Higher conversion rate = More users completing forms');
    console.log('   • Track this daily to identify trends');
    console.log('   • If rate is low, consider improving your form UX');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

getConversionRate();
