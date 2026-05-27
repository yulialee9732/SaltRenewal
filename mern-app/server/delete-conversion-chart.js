// Delete the conversion rate pie chart
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { google } = require('googleapis');

const deleteConversionChart = async () => {
  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
    const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    const auth = new google.auth.GoogleAuth({
      credentials: CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('🗑️  Deleting Conversion Chart...\n');

    // Get the spreadsheet to find the chart
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const targetSheet = spreadsheet.data.sheets.find(s => s.properties.title === '간편견적');
    if (!targetSheet) {
      console.error('❌ 간편견적 sheet not found');
      return;
    }
    
    const charts = targetSheet.charts || [];
    
    if (charts.length === 0) {
      console.log('⚠️  No charts found to delete.');
      return;
    }

    // Delete all charts
    const deleteRequests = charts.map(chart => ({
      deleteEmbeddedObject: {
        objectId: chart.chartId
      }
    }));

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: deleteRequests
      }
    });

    console.log(`✅ Deleted ${charts.length} chart(s) from 간편견적`);
    
    // Also clear the summary data in columns P-R
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: '간편견적!P:R',
    });

    console.log('✅ Cleared summary data in columns P-R');
    console.log('\n💡 Ready to recreate the chart!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      error.errors.forEach(e => console.error('  ', e.message));
    }
  }
};

deleteConversionChart();
