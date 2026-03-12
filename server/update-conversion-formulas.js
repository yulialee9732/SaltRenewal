// Update conversion rate formulas to use dynamic ranges
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { google } = require('googleapis');

const updateConversionFormulas = async () => {
  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
    const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    const auth = new google.auth.GoogleAuth({
      credentials: CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📊 Updating Conversion Rate Formulas...\n');

    // Update summary data with dynamic ranges
    // Column H is now 전환(O/X) after adding 화소 column
    // Using H2:H (open-ended range) will include all rows automatically
    const summaryData = [
      ['Conversion Status', 'Count', 'Percentage'],
      ['Converted (O)', `=COUNTIF(H2:H,"O")`, `=IF(COUNTA(H2:H)>0, Q2/COUNTA(H2:H)*100, 0)`],
      ['Not Converted (X)', `=COUNTIF(H2:H,"X")`, `=IF(COUNTA(H2:H)>0, Q3/COUNTA(H2:H)*100, 0)`]
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: '간편견적!P1:R3',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: summaryData,
      },
    });

    console.log('✅ Conversion formulas updated successfully!');
    console.log('\n📍 Updated Features:');
    console.log('   - Using column H (전환 O/X) after 화소 column addition');
    console.log('   - Using open-ended ranges (H2:H) for automatic expansion');
    console.log('   - Added percentage column (R) for better insights');
    console.log('\n💡 The formulas will now automatically include ALL new entries!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      error.errors.forEach(e => console.error('  ', e.message));
    }
  }
};

updateConversionFormulas();
