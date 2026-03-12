// Create a pie chart showing conversion rate in Google Sheets
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { google } = require('googleapis');

const createConversionChart = async () => {
  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
    const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    const auth = new google.auth.GoogleAuth({
      credentials: CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📊 Creating Conversion Rate Pie Chart...\n');

    // Get the sheet ID for 간편견적
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const targetSheet = spreadsheet.data.sheets.find(s => s.properties.title === '간편견적');
    if (!targetSheet) {
      console.error('❌ 간편견적 sheet not found');
      return;
    }
    
    const sheetId = targetSheet.properties.sheetId;

    // First, create a summary area with conversion data
    // We'll add this data in columns P-R (far right)
    // Using H2:H (open-ended range) to automatically include all rows
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

    console.log('✅ Summary data added to columns P-R');

    // Create the pie chart with improved styling
    const chartRequest = {
      addChart: {
        chart: {
          spec: {
            title: 'Conversion Rate - 전환율',
            titleTextFormat: {
              fontSize: 14,
              bold: true
            },
            pieChart: {
              legendPosition: 'RIGHT_LEGEND',
              domain: {
                sourceRange: {
                  sources: [{
                    sheetId: sheetId,
                    startRowIndex: 1,
                    endRowIndex: 3,
                    startColumnIndex: 15, // Column P
                    endColumnIndex: 16
                  }]
                }
              },
              series: {
                sourceRange: {
                  sources: [{
                    sheetId: sheetId,
                    startRowIndex: 1,
                    endRowIndex: 3,
                    startColumnIndex: 16, // Column Q
                    endColumnIndex: 17
                  }]
                }
              },
              threeDimensional: false,
              pieHole: 0.4 // Donut chart style
            },
            fontName: 'Arial'
          },
          position: {
            overlayPosition: {
              anchorCell: {
                sheetId: sheetId,
                rowIndex: 5,
                columnIndex: 15 // Column P (right side)
              },
              offsetXPixels: 0,
              offsetYPixels: 0,
              widthPixels: 600,
              heightPixels: 450
            }
          }
        }
      }
    };

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [chartRequest]
      }
    });

    console.log('✅ Pie chart created successfully!');
    console.log('\n📍 Chart Location:');
    console.log('   Sheet: 간편견적');
    console.log('   Position: Right side (starting at column P)');
    console.log('   Size: 600x450 pixels');
    console.log('   Data Source: columns P-R (auto-updating with dynamic ranges)');
    console.log('\n💡 The chart will automatically update as new entries are added!');
    console.log('   Using open-ended ranges (H2:H) to include all rows');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      error.errors.forEach(e => console.error('  ', e.message));
    }
  }
};

createConversionChart();
