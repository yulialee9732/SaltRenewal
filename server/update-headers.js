require('dotenv').config({ path: '.env' });
const { google } = require('googleapis');

const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

const auth = new google.auth.GoogleAuth({
  credentials: CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});
const sheets = google.sheets({ version: 'v4', auth });

// Correct headers matching the actual data column order in addPriceEstimate
const headers = [[
  '현황',    // A
  '시간',    // B
  '경로',    // C
  '연락처',  // D
  '타입',    // E
  '주소',    // F
  '희망날짜', // G
  '희망 시간', // H
  '화소',    // I
  '실외',    // J
  '실내',    // K
  'IoT',     // L
  '특수공사', // M
  '인터넷',  // N
  '메모',    // O
  '인입 폼', // P
  'IP'       // Q
]];

Promise.all([
  sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'SALT 상담신청!A1:Q1',
    valueInputOption: 'USER_ENTERED',
    resource: { values: headers }
  })
]).then(() => {
  console.log('✅ Headers updated for SALT 상담신청');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
