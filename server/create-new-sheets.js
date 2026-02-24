require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { google } = require('googleapis');

async function createNewSheets() {
  const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
  const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);

  const auth = new google.auth.GoogleAuth({
    credentials: CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  try {
    // Create two new sheets
    const requests = [
      {
        addSheet: {
          properties: {
            title: '간편견적'
          }
        }
      },
      {
        addSheet: {
          properties: {
            title: '상담신청'
          }
        }
      }
    ];

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: requests
      }
    });

    console.log('✅ Created new sheets: 간편견적, 상담신청');

    // Now set up headers
    // 간편견적 headers: IP / 시간 / 실내 / 실외 / IoT / 특수공사 / 전환(O/X) / 연락처 / 주소 / 타입 / 인터넷/ 희망날짜
    const quickEstimateHeaders = [[
      'IP 주소',
      '시간',
      '실내',
      '실외',
      'IoT',
      '특수공사',
      '전환(O/X)',
      '연락처',
      '주소',
      '타입',
      '인터넷',
      '희망날짜'
    ]];

    // 상담신청 headers: IP / 시간 / 연락처 / 주소 / 타입 / 실내 / 실외 / IoT / 특수공사 / 인터넷 / 희망날짜
    const consultationHeaders = [[
      'IP 주소',
      '시간',
      '연락처',
      '주소',
      '타입',
      '실내',
      '실외',
      'IoT',
      '특수공사',
      '인터넷',
      '희망날짜'
    ]];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: '간편견적!A1:L1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: quickEstimateHeaders,
      },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: '상담신청!A1:K1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: consultationHeaders,
      },
    });

    console.log('✅ Headers set up successfully');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createNewSheets();
