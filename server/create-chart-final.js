// Create pie chart with percentage and count labels
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { google } = require('googleapis');

const createChartWithPercentages = async () => {
  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
    const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    const auth = new google.auth.GoogleAuth({
      credentials: CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📊 Creating Enhanced Conversion Chart...\n');

    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const targetSheet = spreadsheet.data.sheets.find(s => s.properties.title === '간편견적');
    if (!targetSheet) {
      console.error('❌ 간편견적 sheet not found');
      return;
    }
    
    const sheetId = targetSheet.properties.sheetId;

    // Delete any existing charts
    const existingCharts = targetSheet.charts || [];
    if (existingCharts.length > 0) {
      const deleteRequests = existingCharts.map(chart => ({
        deleteEmbeddedObject: { objectId: chart.chartId }
      }));
      
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: { requests: deleteRequests }
      });
      console.log('🗑️  Deleted existing charts');
    }

    // Update summary data to include percentages
    const summaryData = [
      ['Status', 'Count', 'Percentage'],
      ['Converted (O)', '=COUNTIF(G2:G1000,"O")', '=ROUND(COUNTIF(G2:G1000,"O")/COUNTA(G2:G1000)*100,1)&"%"'],
      ['Not Converted (X)', '=COUNTIF(G2:G1000,"X")', '=ROUND(COUNTIF(G2:G1000,"X")/COUNTA(G2:G1000)*100,1)&"%"']
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: '간편견적!P1:R3',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: summaryData,
      },
    });

    console.log('✅ Updated summary data with percentages');

    // Create pie chart
    const chartRequest = {
      addChart: {
        chart: {
          spec: {
            title: 'Conversion Rate - 전환율',
            titleTextFormat: {
              fontSize: 16,
              bold: true
            },
            pieChart: {
              legendPosition: 'LABELED_LEGEND',
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
              pieHole: 0.4
            }
          },
          position: {
            overlayPosition: {
              anchorCell: {
                sheetId: sheetId,
                rowIndex: 5,
                columnIndex: 15
              },
              offsetXPixels: 0,
              offsetYPixels: 0,
              widthPixels: 550,
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

    console.log('✅ Pie chart created with labels!');
    console.log('\n📊 Chart Features:');
    console.log('   • Donut-style pie chart');
    console.log('   • Labeled legend showing percentages');
    console.log('   • Column P: Status labels');
    console.log('   • Column Q: Counts');
    console.log('   • Column R: Percentages');
    console.log('\n📍 Location: 간편견적 sheet, right side (Column P area)');
    console.log('\n💡 To show numbers ON the slices:');
    console.log('   1. Click the chart in Google Sheets');
    console.log('   2. Click the 3-dot menu → Edit chart');
    console.log('   3. Go to "Customize" tab');
    console.log('   4. Click "Pie chart"');
    console.log('   5. Set "Slice label" to "Value" or "Percentage"');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      error.errors.forEach(e => console.error('  ', e.message));
    }
  }
};

createChartWithPercentages();
