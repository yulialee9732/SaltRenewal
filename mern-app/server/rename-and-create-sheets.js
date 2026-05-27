// Rename and create sheets
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { google } = require('googleapis');

const renameAndCreateSheets = async () => {
  try {
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
    const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    const auth = new google.auth.GoogleAuth({
      credentials: CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('📋 Fetching spreadsheet info...');
    
    // Get current sheets
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const existingSheets = spreadsheet.data.sheets;
    console.log('\n📊 Current sheets:');
    existingSheets.forEach(sheet => {
      console.log(`  - ${sheet.properties.title} (ID: ${sheet.properties.sheetId})`);
    });

    // Find the "상담신청" sheet to rename
    const targetSheet = existingSheets.find(s => s.properties.title === '상담신청');
    
    const requests = [];

    if (targetSheet) {
      console.log('\n✏️  Renaming "상담신청" to "SALT 상담신청"...');
      requests.push({
        updateSheetProperties: {
          properties: {
            sheetId: targetSheet.properties.sheetId,
            title: 'SALT 상담신청'
          },
          fields: 'title'
        }
      });
    } else {
      console.log('\n⚠️  "상담신청" sheet not found');
    }

    // Check if "KT 상담신청" already exists
    const ktSheetExists = existingSheets.find(s => s.properties.title === 'KT 상담신청');
    
    if (!ktSheetExists) {
      console.log('➕ Creating "KT 상담신청" sheet...');
      requests.push({
        addSheet: {
          properties: {
            title: 'KT 상담신청',
            gridProperties: {
              rowCount: 1000,
              columnCount: 13
            }
          }
        }
      });
    } else {
      console.log('\n✅ "KT 상담신청" sheet already exists');
    }

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: { requests }
      });
      console.log('\n✅ Sheets updated successfully!');
    } else {
      console.log('\n✅ No changes needed');
    }

    // Now set up headers
    console.log('\n📝 Setting up sheet headers...');
    const { setupSheetHeaders } = require('./src/services/googleSheets');
    await setupSheetHeaders();

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.errors) {
      error.errors.forEach(e => console.error('  ', e.message));
    }
  }
};

renameAndCreateSheets();
