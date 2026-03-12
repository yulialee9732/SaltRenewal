// Test that new entries appear at the top of Google Sheets

const testData = {
  type: 'full',
  converted: true,
  initialSelection: {
    cameraType: '210만',
    indoorCount: 3,
    outdoorCount: 2,
    iotOptions: ['doorlock'],
    specialOptions: ['intercom']
  },
  currentSelection: {
    cameraType: '210만',
    indoorCount: 3,
    outdoorCount: 2,
    iotOptions: ['doorlock'],
    specialOptions: ['intercom']
  },
  contactInfo: {
    phoneNumber: '010-9999-8888',
    address: '서울시 테스트구 최상단',
    locationType: '아파트',
    hasInternet: '있음'
  },
  appointment: {
    date: new Date('2026-02-25'),
    time: '14:00'
  },
  price: 35000,
  submittedAt: new Date().toISOString()
};

console.log('📝 Submitting test entry...');
console.log(`   Phone: ${testData.contactInfo.phoneNumber}`);
console.log(`   Address: ${testData.contactInfo.address}`);
console.log(`   This entry should appear at the TOP of SALT 상담신청 sheet\n`);

fetch('http://localhost:5001/api/price-estimate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData),
})
  .then(res => res.json())
  .then(data => {
    console.log('✅ Success:', data.message);
    console.log('\n📊 Please check your Google Sheets:');
    console.log('   Sheet: SALT 상담신청');
    console.log('   The entry with phone "010-9999-8888" should be in ROW 2 (top entry)');
  })
  .catch(err => console.error('❌ Error:', err.message));
