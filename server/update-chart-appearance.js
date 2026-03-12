// Update the conversion rate chart appearance
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { google } = require('googleapis');

const updateChartAppearance = async () => {
  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
    const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    const auth = new google.auth.GoogleAuth({
      credentials: CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('🎨 Updating Chart Appearance...\n');

    // Get the spreadsheet to find the chart
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const targetSheet = spreadsheet.data.sheets.find(s => s.properties.title === '간편견적');
    if (!targetSheet) {
      console.error('❌ 간편견적 sheet not found');
      return;
    }
    
    const sheetId = targetSheet.properties.sheetId;
    const charts = targetSheet.charts || [];
    
    if (charts.length === 0) {
      console.log('⚠️  No charts found. Run create-conversion-chart.js first.');
      return;
    }

    const chartId = charts[0].chartId;
    console.log(`📊 Found chart ID: ${chartId}`);

    // Update the chart with new styling
    const updateRequest = {
      updateChartSpec: {
        chartId: chartId,
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
        }
      }
    };

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [updateRequest]
      }
    });

    console.log('✅ Chart appearance updated successfully!');
    console.log('\n📍 Updates Applied:');
    console.log('   - Title: Bold, larger font (14px)');
    console.log('   - Donut hole: Increased to 40%');
    console.log('   - Font: Arial');
    console.log('   - Legend: Right position');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      error.errors.forEach(e => console.error('  ', e.message));
    }
  }
};

updateChartAppearance();
