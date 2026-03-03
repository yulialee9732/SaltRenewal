// Test all three form types
require('dotenv').config();

const { addPriceEstimate } = require('./src/services/googleSheets');

const testAllFormTypes = async () => {
  console.log('🧪 Testing all three form types...\n');

  // Test 1: 날짜 예약형 (Schedule modal from LandingPage - has scheduleOnly: true)
  console.log('1️⃣  Testing 날짜 예약형 (LandingPage Schedule Modal)...');
  const scheduleFormData = {
    type: 'schedule',
    initialSelection: null,
    currentSelection: {
      cameraType: '',
      indoorCount: 2,
      outdoorCount: 1
    },
    contactInfo: {
      phoneNumber: '010-6666-6666',
      address: '서울시 강남구 예약동',
      locationType: '',
      hasInternet: ''
    },
    appointment: {
      date: new Date('2026-03-10'),
      time: '10am'
    },
    scheduleOnly: true,
    price: 0,
    ipAddress: '192.168.1.66',
    submittedAt: new Date().toISOString()
  };
  await addPriceEstimate(scheduleFormData);
  console.log('   ✅ 날짜 예약형 submitted\n');

  // Wait 2 seconds
  await new Promise(r => setTimeout(r, 2000));

  // Test 2: 견적 확인형 (PriceEstimate component - has initialSelection)
  console.log('2️⃣  Testing 견적 확인형 (PriceEstimate Component)...');
  const priceEstimateData = {
    type: 'full',
    initialSelection: {
      cameraType: '210만',
      indoorCount: 3,
      outdoorCount: 1,
      iotOptions: [],
      specialOptions: []
    },
    currentSelection: {
      cameraType: '210만',
      indoorCount: 3,
      outdoorCount: 1,
      iotOptions: ['지문형 출입통제', '화재 경보 센서'],
      specialOptions: ['층고 4m 이상']
    },
    contactInfo: {
      phoneNumber: '010-7777-7777',
      address: '서울시 서초구 견적동',
      locationType: '사무실',
      hasInternet: '네'
    },
    appointment: {
      date: new Date('2026-03-12'),
      time: '2pm'
    },
    price: 30000,
    ipAddress: '192.168.1.77',
    submittedAt: new Date().toISOString()
  };
  await addPriceEstimate(priceEstimateData);
  console.log('   ✅ 견적 확인형 submitted\n');

  // Wait 2 seconds
  await new Promise(r => setTimeout(r, 2000));

  // Test 3: 상담 신청형 (Consultation form from LandingPage - consultationRequest: true)
  console.log('3️⃣  Testing 상담 신청형 (LandingPage Consultation Form)...');
  const consultationData = {
    type: 'consultation',
    consultationRequest: true,
    initialSelection: null,
    currentSelection: {
      cameraType: '',
      indoorCount: 4,
      outdoorCount: 2
    },
    contactInfo: {
      phoneNumber: '010-8888-8888',
      address: '서울시 송파구 상담동',
      locationType: '매장',
      hasInternet: 'CCTV와 함께 설치 희망'
    },
    appointment: {
      date: null,
      time: ''
    },
    price: 0,
    ipAddress: '192.168.1.88',
    submittedAt: new Date().toISOString()
  };
  await addPriceEstimate(consultationData);
  console.log('   ✅ 상담 신청형 submitted\n');

  console.log('✅ All three form types tested! Check Google Sheets.');
  console.log('\nExpected results in SALT 상담신청:');
  console.log('  Row 2: 상담 신청형 - 010-8888-8888');
  console.log('  Row 3: 견적 확인형 - 010-7777-7777');
  console.log('  Row 4: 날짜 예약형 - 010-6666-6666');
};

testAllFormTypes();
