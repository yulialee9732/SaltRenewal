const { google } = require('googleapis');
// Email service removed - paths preserved:
// const { sendErrorNotification } = require('./emailService');

// Initialize Google Sheets API
let sheets = null;
let auth = null;

const initializeSheets = async () => {
  // Read env variables at runtime, not at module load time
  const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
  const CREDENTIALS = process.env.GOOGLE_CREDENTIALS ? JSON.parse(process.env.GOOGLE_CREDENTIALS) : null;
  
  console.log('🔍 Google Sheets Debug:');
  console.log('  SPREADSHEET_ID:', SPREADSHEET_ID ? '✓ Found' : '✗ Missing');
  console.log('  CREDENTIALS:', CREDENTIALS ? '✓ Found' : '✗ Missing');
  
  if (!CREDENTIALS || !SPREADSHEET_ID) {
    console.warn('⚠️  Google Sheets credentials not configured. Skipping Google Sheets integration.');
    return null;
  }

  try {
    auth = new google.auth.GoogleAuth({
      credentials: CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    sheets = google.sheets({ version: 'v4', auth });
    console.log('✅ Google Sheets API initialized');
    return sheets;
  } catch (error) {
    console.error('❌ Error initializing Google Sheets:', error.message);
    return null;
  }
};

// Check for duplicate entries in the sheet (by phone number)
const checkDuplicate = async (sheetName, phoneNumber) => {
  try {
    if (!phoneNumber) return '';
    
    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A2:P1000`, // Read all data rows (skip header)
    });

    const rows = response.data.values || [];

    // Check for duplicate phone number
    // Column order: 체크/시간/경로/인입 폼/연락처(E, index 4)/타입/주소/...
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const existingPhone = row[4]; // Column E: 연락처

      if (existingPhone && existingPhone === phoneNumber) {
        return `중복 연락처 (${i + 2}번째 줄)`;
      }
    }

    return '';
  } catch (error) {
    console.error('Error checking duplicates:', error.message);
    return ''; // Return empty string if error occurs
  }
};

// Add price estimate to Google Sheets
const addPriceEstimate = async (data) => {
  try {
    if (!sheets) {
      sheets = await initializeSheets();
      if (!sheets) return; // Skip if not configured
    }

    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

    const {
      type,
      converted,
      initialSelection,
      currentSelection,
      contactInfo,
      appointment,
      price,
      ipAddress,
      submittedAt
    } = data;

    // All forms go to SALT 상담신청
    const sheetName = 'SALT 상담신청';
    
    // Check for duplicates
    const duplicateMemo = await checkDuplicate(sheetName, contactInfo.phoneNumber);
    
    // Determine form type (인입 폼)
    // - 견적 확인형: PriceEstimate component (has initialSelection from step 1)
    // - 날짜 예약형: LandingPage schedule modal (scheduleOnly: true, no initialSelection)
    // - 상담 신청형: LandingPage consultation form (consultationRequest: true)
    let formType;
    if (initialSelection) {
      // PriceEstimate component - user went through camera selection flow
      formType = '견적 확인형';
    } else if (data.scheduleOnly) {
      // LandingPage schedule modal
      formType = '날짜 예약형';
    } else if (data.consultationRequest) {
      // LandingPage consultation form
      formType = '상담 신청형';
    } else if (appointment && appointment.date && appointment.time) {
      // Fallback: has date/time but no distinguishing flag
      formType = '날짜 예약형';
    } else {
      formType = '상담 신청형';
    }
    
    // Format time as YY.MM.DD h:mmam/pm (Seoul timezone)
    const formatTime = (date) => {
      const d = new Date(date);
      const options = { timeZone: 'Asia/Seoul' };
      const year = d.toLocaleString('en-US', { ...options, year: '2-digit' });
      const month = d.toLocaleString('en-US', { ...options, month: '2-digit' });
      const day = d.toLocaleString('en-US', { ...options, day: '2-digit' });
      const hour = d.toLocaleString('en-US', { ...options, hour: 'numeric', hour12: true }).toLowerCase();
      const minute = d.toLocaleString('en-US', { ...options, minute: '2-digit' });
      // Extract hour number and am/pm
      const hourMatch = hour.match(/(\d+)\s*(am|pm)/i);
      if (hourMatch) {
        return `${year}.${month}.${day} ${hourMatch[1]}:${minute}${hourMatch[2]}`;
      }
      return `${year}.${month}.${day}`;
    };
    
    // Column order: 체크/시간/경로/인입 폼/연락처/타입/주소/희망날짜/희망시간/화소/실외/실내/IoT/특수공사/인터넷/메모/IP
    const row = [
      false, // 체크 - checkbox initially unchecked
      formatTime(submittedAt), // 시간
      '솔트', // 경로
      formType, // 인입 폼
      contactInfo.phoneNumber || '-', // 연락처
      contactInfo.locationType || '-', // 타입
      contactInfo.address || '-', // 주소
      appointment?.date ? new Date(appointment.date).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }) : '-', // 희망날짜
      appointment?.time || '-', // 희망시간
      currentSelection.cameraType || initialSelection?.cameraType || '-', // 화소
      currentSelection.outdoorCount || 0, // 실외
      currentSelection.indoorCount || 0, // 실내
      currentSelection.iotOptions && currentSelection.iotOptions.length > 0 ? currentSelection.iotOptions.join(', ') : '-', // IoT
      currentSelection.specialOptions && currentSelection.specialOptions.length > 0 ? currentSelection.specialOptions.join(', ') : '-', // 특수공사
      contactInfo.hasInternet || '-', // 인터넷
      duplicateMemo || '-', // 메모
      ipAddress || '-' // IP
    ];
    const range = 'SALT 상담신청!A:Q';

    // Get the sheet ID for the target sheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    const targetSheet = spreadsheet.data.sheets.find(s => s.properties.title === sheetName);
    const sheetId = targetSheet ? targetSheet.properties.sheetId : 0;

    // Insert a new row at position 2 (index 1, right after header)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          insertDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: 1,
              endIndex: 2
            },
            inheritFromBefore: false
          }
        }]
      }
    });

    // Update the newly inserted row with data
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A2`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [row],
      },
    });

    console.log(`✅ ${formType} added to SALT 상담신청 (top row)`);
  } catch (error) {
    console.error('❌ Error adding price estimate to Google Sheets:', error.message);
  }
};

// Create headers for sheets (run once to set up)
const setupSheetHeaders = async () => {
  try {
    if (!sheets) {
      sheets = await initializeSheets();
      if (!sheets) return;
    }

    // 간편견적 headers: IP / 시간 / 화소 / 실내 / 실외 / IoT / 특수공사 / 전환(O/X) / 연락처 / 주소 / 타입 / 인터넷/ 희망날짜 / 희망 시간 / 메모
    const quickEstimateHeaders = [[
      'IP 주소',
      '시간',
      '화소',
      '실내',
      '실외',
      'IoT',
      '특수공사',
      '전환(O/X)',
      '연락처',
      '주소',
      '타입',
      '인터넷',
      '희망날짜',
      '희망 시간',
      '메모'
    ]];

    // SALT/KT 상담신청 headers: IP / 시간 / 화소 / 연락처 / 주소 / 타입 / 실내 / 실외 / IoT / 특수공사 / 인터넷 / 희망날짜 / 희망 시간 / 메모
    const consultationHeaders = [[
      'IP 주소',
      '시간',
      '화소',
      '연락처',
      '주소',
      '타입',
      '실내',
      '실외',
      'IoT',
      '특수공사',
      '인터넷',
      '희망날짜',
      '희망 시간',
      '메모'
    ]];

    // Update headers for all sheets
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: '간편견적!A1:O1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: quickEstimateHeaders,
      },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: 'SALT 상담신청!A1:N1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: consultationHeaders,
      },
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      range: 'KT 상담신청!A1:N1',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: consultationHeaders,
      },
    });

    console.log('✅ Google Sheets headers set up successfully (간편견적, SALT 상담신청, KT 상담신청)');
  } catch (error) {
    console.error('❌ Error setting up sheet headers:', error.message);
  }
};

// Get daily statistics for email report
const getDailyStatistics = async () => {
  try {
    if (!sheets) {
      sheets = await initializeSheets();
      if (!sheets) return null;
    }

    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
    
    // Get current time in Korean timezone
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    
    // Get yesterday's date range (Korean time)
    const yesterdayStart = new Date(now);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    
    const yesterdayEnd = new Date(now);
    yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
    yesterdayEnd.setHours(23, 59, 59, 999);
    
    // Get this week's date range (Monday to Sunday)
    const today = new Date(now);
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
    const mondayOffset = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + mondayOffset);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Fetch SALT 상담신청 data
    const saltResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'SALT 상담신청!A2:N1000',
    });
    
    // Fetch KT 상담신청 data
    const ktResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'KT 상담신청!A2:N1000',
    });

    const saltRows = saltResponse.data.values || [];
    const ktRows = ktResponse.data.values || [];

    // Count entries
    const countEntries = (rows, startDate, endDate) => {
      return rows.filter(row => {
        const timeStr = row[1]; // Column B: 시간
        if (!timeStr) return false;
        
        // Parse Korean date format (e.g., "2026. 2. 13. 오전 10:30:00")
        const entryDate = new Date(timeStr);
        return entryDate >= startDate && entryDate <= endDate;
      }).length;
    };

    const saltYesterday = countEntries(saltRows, yesterdayStart, yesterdayEnd);
    const ktYesterday = countEntries(ktRows, yesterdayStart, yesterdayEnd);
    const saltThisWeek = countEntries(saltRows, weekStart, weekEnd);
    const ktThisWeek = countEntries(ktRows, weekStart, weekEnd);
    
    // Count total current entries (all rows with data)
    const saltTotal = saltRows.filter(row => row[1]).length; // Has timestamp
    const ktTotal = ktRows.filter(row => row[1]).length; // Has timestamp

    return {
      saltYesterday,
      ktYesterday,
      saltThisWeek,
      ktThisWeek,
      saltTotal,
      ktTotal,
      yesterdayDate: yesterdayStart.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' }),
      weekRange: `${weekStart.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })} - ${weekEnd.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}`
    };
  } catch (error) {
    console.error('❌ Error getting daily statistics:', error.message);
    return null;
  }
};

// Get all estimates from Google Sheets for employee dashboard
const getAllSheetEstimates = async () => {
  try {
    if (!sheets) {
      sheets = await initializeSheets();
      if (!sheets) return { quickEstimates: [], saltConsultations: [], ktConsultations: [] };
    }

    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

    // Fetch 간편견적
    const quickResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: '간편견적!A2:O1000',
    });

    // Fetch SALT 상담신청
    const saltResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'SALT 상담신청!A2:N1000',
    });

    // Fetch KT 상담신청
    const ktResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'KT 상담신청!A2:N1000',
    });

    const quickRows = quickResponse.data.values || [];
    const saltRows = saltResponse.data.values || [];
    const ktRows = ktResponse.data.values || [];

    // Parse 간편견적: IP / 시간 / 화소 / 실내 / 실외 / IoT / 특수공사 / 전환(O/X) / 연락처 / 주소 / 타입 / 인터넷/ 희망날짜 / 희망 시간 / 메모
    const quickEstimates = quickRows
      .filter(row => row[1]) // Has timestamp
      .map((row, index) => {
        const timestamp = row[1] || '';
        const phoneNumber = row[8] || '';
        // Create stable ID using phone number and timestamp
        const stableId = `quick-${phoneNumber}-${timestamp}`.replace(/[^a-zA-Z0-9-]/g, '_');
        
        return {
          id: stableId,
          type: 'quick',
          ipAddress: row[0] || '',
          submittedAt: timestamp,
          cameraType: row[2] || '',
          indoorCount: row[3] || 0,
          outdoorCount: row[4] || 0,
          iotOptions: row[5] || '',
          specialOptions: row[6] || '',
          converted: row[7] === 'O',
          phoneNumber: phoneNumber,
          address: row[9] || '',
          locationType: row[10] || '',
          hasInternet: row[11] || '',
          appointmentDate: row[12] || '',
          appointmentTime: row[13] || '',
          memo: row[14] || ''
        };
      });

    // Parse 상담신청: IP / 시간 / 화소 / 연락처 / 주소 / 타입 / 실내 / 실외 / IoT / 특수공사 / 인터넷 / 희망날짜 / 희망 시간 / 메모
    const parseConsultation = (row, index, prefix) => {
      const timestamp = row[1] || '';
      const phoneNumber = row[3] || '';
      // Create stable ID using phone number and timestamp
      const stableId = `${prefix}-${phoneNumber}-${timestamp}`.replace(/[^a-zA-Z0-9-]/g, '_');
      
      return {
        id: stableId,
        type: 'consultation',
        ipAddress: row[0] || '',
        submittedAt: timestamp,
        cameraType: row[2] || '',
        phoneNumber: phoneNumber,
        address: row[4] || '',
        locationType: row[5] || '',
        indoorCount: row[6] || 0,
        outdoorCount: row[7] || 0,
        iotOptions: row[8] || '',
        specialOptions: row[9] || '',
        hasInternet: row[10] || '',
        appointmentDate: row[11] || '',
        appointmentTime: row[12] || '',
        memo: row[13] || ''
      };
    };

    const saltConsultations = saltRows
      .filter(row => row[1])
      .map((row, index) => parseConsultation(row, index, 'salt'));

    const ktConsultations = ktRows
      .filter(row => row[1])
      .map((row, index) => parseConsultation(row, index, 'kt'));

    return {
      quickEstimates,
      saltConsultations,
      ktConsultations,
      total: quickEstimates.length + saltConsultations.length + ktConsultations.length
    };
  } catch (error) {
    console.error('❌ Error getting sheet estimates:', error.message);
    return { quickEstimates: [], saltConsultations: [], ktConsultations: [], total: 0 };
  }
};

// Add customer question to Google Sheets
const addCustomerQuestion = async (data) => {
  try {
    if (!sheets) {
      sheets = await initializeSheets();
      if (!sheets) return null;
    }

    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
    const sheetName = '고객 질문';

    const { phone, question, ipAddress, mongoId } = data;
    const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    // Row format: MongoDB ID / 시간 / 연락처 / 질문 / 읽음 / IP주소
    const row = [
      mongoId || '',
      timestamp,
      phone || '',
      question || '',
      'X', // Not read
      ipAddress || ''
    ];

    // Get the sheet ID
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    const targetSheet = spreadsheet.data.sheets.find(s => s.properties.title === sheetName);
    
    if (!targetSheet) {
      // Create the sheet if it doesn't exist
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [{
            addSheet: {
              properties: {
                title: sheetName
              }
            }
          }]
        }
      });

      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1:F1`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [['ID', '시간', '연락처', '질문', '읽음', 'IP주소']],
        },
      });

      // Add the data row
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A:F`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [row],
        },
      });
    } else {
      const sheetId = targetSheet.properties.sheetId;

      // Insert a new row at position 2 (after header)
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
          requests: [{
            insertDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: 1,
                endIndex: 2
              },
              inheritFromBefore: false
            }
          }]
        }
      });

      // Update the newly inserted row
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A2`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [row],
        },
      });
    }

    console.log('✅ Customer question added to Google Sheets');
    return true;
  } catch (error) {
    console.error('❌ Error adding customer question to Google Sheets:', error.message);
    return false;
  }
};

// Update question read status in Google Sheets
const updateQuestionReadStatus = async (mongoId, read) => {
  try {
    if (!sheets) {
      sheets = await initializeSheets();
      if (!sheets) return false;
    }

    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
    const sheetName = '고객 질문';

    // Get all questions to find the row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A2:F1000`,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === mongoId);
    
    if (rowIndex === -1) return false;

    // Update the read status (column E, index 4)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!E${rowIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[read ? 'O' : 'X']],
      },
    });

    console.log(`✅ Question ${mongoId} marked as ${read ? 'read' : 'unread'} in Google Sheets`);
    return true;
  } catch (error) {
    console.error('❌ Error updating question status in Google Sheets:', error.message);
    return false;
  }
};

// Delete a customer question from Google Sheets
const deleteCustomerQuestion = async (mongoId) => {
  try {
    if (!sheets) {
      sheets = await initializeSheets();
      if (!sheets) return false;
    }

    const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
    const sheetName = '고객 질문';

    // Get sheet ID and find the row
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    const targetSheet = spreadsheet.data.sheets.find(s => s.properties.title === sheetName);
    if (!targetSheet) return false;

    const sheetId = targetSheet.properties.sheetId;

    // Get all questions to find the row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A2:F1000`,
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === mongoId);
    
    if (rowIndex === -1) return false;

    // Delete the row (rowIndex + 2 because of header and 0-indexing)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex + 1, // +1 for header
              endIndex: rowIndex + 2
            }
          }
        }]
      }
    });

    console.log(`✅ Question ${mongoId} deleted from Google Sheets`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting question from Google Sheets:', error.message);
    return false;
  }
};

module.exports = {
  initializeSheets,
  addPriceEstimate,
  setupSheetHeaders,
  getDailyStatistics,
  getAllSheetEstimates,
  addCustomerQuestion,
  updateQuestionReadStatus,
  deleteCustomerQuestion
};
