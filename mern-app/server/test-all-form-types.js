// Test all three form types with correct column order
// Column order: 체크/시간/경로/인입 폼/연락처/타입/주소/희망날짜/희망시간/화소/실외/실내/IoT/특수공사/인터넷/메모/IP
require('dotenv').config();

const { addPriceEstimate } = require('./src/services/googleSheets');

const testAllFormTypes = async () => {
  console.log('🧪 Testing all three form types...\n');
  console.log('Column order: 체크/시간/경로/인입 폼/연락처/타입/주소/희망날짜/희망시간/화소/실외/실내/IoT/특수공사/인터넷/메모/IP\n');

  // Test 1: 날짜 예약형 (Schedule modal from LandingPage - has scheduleOnly: true)
  console.log('1️⃣  Testing 날짜 예약형 (LandingPage Schedule Modal)...');
  const scheduleFormData = {
    scheduleOnly: true,
    initialSelection: null,
    currentSelection: {
      cameraType: '',
      indoorCount: 3,
      outdoorCount: 1,
      iotOptions: [],
      specialOptions: []
    },
    contactInfo: {
      phoneNumber: '010-1234-2001',
      address: '서울시 강남구 예약동 123',
      locationType: '',
      hasInternet: ''
    },
    appointment: {
      date: new Date('2026-03-10'),
      time: '10am'
    },
    price: 0,
    ipAddress: '10.0.0.1',
    submittedAt: new Date().toISOString()
  };
  await addPriceEstimate(scheduleFormData);
  console.log('   ✅ 날짜 예약형 submitted\n');

  // Wait 2 seconds
  await new Promise(r => setTimeout(r, 2000));

  // Test 2: 견적 확인형 (PriceEstimate component - has initialSelection)
  console.log('2️⃣  Testing 견적 확인형 (PriceEstimate Component)...');
  const priceEstimateData = {
    initialSelection: {
      cameraType: '210만',
      indoorCount: 3,
      outdoorCount: 1,
      iotOptions: [],
      specialOptions: []
    },
    currentSelection: {
      cameraType: '210만',
      indoorCount: 4,
      outdoorCount: 2,
      iotOptions: ['지문형 출입통제', '화재 경보 센서'],
      specialOptions: ['층고 4m 이상', '엘리베이터 공사']
    },
    contactInfo: {
      phoneNumber: '010-1234-2002',
      address: '서울시 서초구 견적동 456',
      locationType: '학원',
      hasInternet: '네'
    },
    appointment: {
      date: new Date('2026-03-12'),
      time: '2pm'
    },
    price: 40000,
    ipAddress: '10.0.0.2',
    submittedAt: new Date().toISOString()
  };
  await addPriceEstimate(priceEstimateData);
  console.log('   ✅ 견적 확인형 submitted\n');

  // Wait 2 seconds
  await new Promise(r => setTimeout(r, 2000));

  // Test 3: 상담 신청형 (Consultation form from LandingPage - consultationRequest: true)
  console.log('3️⃣  Testing 상담 신청형 (LandingPage Consultation Form)...');
  const consultationData = {
    consultationRequest: true,
    initialSelection: null,
    currentSelection: {
      cameraType: '',
      indoorCount: 5,
      outdoorCount: 3,
      iotOptions: [],
      specialOptions: []
    },
    contactInfo: {
      phoneNumber: '010-1234-2003',
      address: '서울시 송파구 상담동 789',
      locationType: '매장',
      hasInternet: 'CCTV와 함께 설치 희망'
    },
    appointment: {
      date: null,
      time: ''
    },
    price: 0,
    ipAddress: '10.0.0.3',
    submittedAt: new Date().toISOString()
  };
  await addPriceEstimate(consultationData);
  console.log('   ✅ 상담 신청형 submitted\n');

  console.log('✅ All three form types tested! Check Google Sheets.');
  console.log('\nExpected results in SALT 상담신청 (newest at top):');
  console.log('  Row 2: 상담 신청형 - 010-1234-2003 - 매장 - 서울시 송파구 상담동');
  console.log('  Row 3: 견적 확인형 - 010-1234-2002 - 학원 - 서울시 서초구 견적동 - 210만');
  console.log('  Row 4: 날짜 예약형 - 010-1234-2001 - 서울시 강남구 예약동 - 2026. 3. 10. / 10am');
};

testAllFormTypes();
