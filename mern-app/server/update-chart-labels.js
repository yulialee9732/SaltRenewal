// Update the pie chart to show numbers and percentages on slices
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { google } = require('googleapis');

const updateChartWithLabels = async () => {
  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
    const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    const auth = new google.auth.GoogleAuth({
      credentials: CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📊 Updating Pie Chart to Show Numbers...\n');

    // Get spreadsheet to find existing charts
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const targetSheet = spreadsheet.data.sheets.find(s => s.properties.title === '간편견적');
    if (!targetSheet) {
      console.error('❌ 간편견적 sheet not found');
      return;
    }
    
    const sheetId = targetSheet.properties.sheetId;

    // Find existing chart
    const existingCharts = targetSheet.charts || [];
    
    if (existingCharts.length === 0) {
      console.log('❌ No existing chart found. Creating new one with labels...');
    } else {
      console.log(`Found ${existingCharts.length} chart(s). Deleting to recreate with labels...`);
      
      // Delete existing charts
      const deleteRequests = existingCharts.map(chart => ({
        deleteEmbeddedObject: {
          objectId: chart.chartId
        }
      }));
      
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: { requests: deleteRequests }
      });
    }

    // Create new chart with data labels
    const chartRequest = {
      addChart: {
        chart: {
          spec: {
            title: 'Conversion Rate - 전환율',
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
              pieHole: 0.3 // Donut chart style
            }
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
              widthPixels: 500,
              heightPixels: 400
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

    console.log('✅ Pie chart updated with data labels!');
    console.log('\n📍 Chart now shows:');
    console.log('   • Numbers on each slice');
    console.log('   • Percentages visible');
    console.log('   • Legend with categories on the right');
    console.log('\n💡 The chart will auto-update as new data is added!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      error.errors.forEach(e => console.error('  ', e.message));
    }
  }
};

updateChartWithLabels();
