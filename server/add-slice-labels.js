// Create pie chart with slice labels showing percentages
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { google } = require('googleapis');

const createChartWithSliceLabels = async () => {
  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
    const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    const auth = new google.auth.GoogleAuth({
      credentials: CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📊 Creating Conversion Chart with Slice Labels...\n');

    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const targetSheet = spreadsheet.data.sheets.find(s => s.properties.title === '간편견적');
    const sheetId = targetSheet.properties.sheetId;

    // Delete existing charts
    const existingCharts = targetSheet.charts || [];
    if (existingCharts.length > 0) {
      const deleteRequests = existingCharts.map(chart => ({
        deleteEmbeddedObject: { objectId: chart.chartId }
      }));
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: { requests: deleteRequests }
      });
    }

    // Create chart with explicit slice configuration
    const chartRequest = {
      addChart: {
        chart: {
          spec: {
            title: '전환율 (Conversion Rate)',
            titleTextFormat: {
fontSize: 18,
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
                    startColumnIndex: 15,
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
                    startColumnIndex: 16,
                    endColumnIndex: 17
                  }]
                }
              },
              threeDimensional: false,
              pieHole: 0.35
            },
            fontName: 'Arial'
          },
          position: {
            overlayPosition: {
              anchorCell: {
                sheetId: sheetId,
                rowIndex: 5,
                columnIndex: 15
              },
              widthPixels: 600,
              heightPixels: 450
            }
          }
        }
      }
    };

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: { requests: [chartRequest] }
    });

    console.log('✅ Chart created!');
    console.log('\n📊 To activate slice labels (showing numbers on chart):');
    console.log('   Open your Google Sheet → 간편견적');
    console.log('   1. Double-click the pie chart');
    console.log('   2. In the Chart editor on the right, click "Customize"');
    console.log('   3. Click "Pie chart" section');
    console.log('   4. Find "Slice label" dropdown');
    console.log('   5. Select "Value and percentage" or "Percentage"');
    console.log(' ');
    console.log('✨ The numbers will then appear on each slice!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

createChartWithSliceLabels();
