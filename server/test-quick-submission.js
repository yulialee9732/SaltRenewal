// Test submission to 간편견적 when user clicks "견적 확인하기"

const testQuickEstimateSubmission = async () => {
  const quickEstimateData = {
    initialSelection: {
      cameraType: '210만',
      indoorCount: 3,
      outdoorCount: 2,
      iotOptions: ['fingerprint', 'doorlock'],
      specialOptions: ['height']
    },
    currentSelection: {
      cameraType: '210만',
      indoorCount: 3,
      outdoorCount: 2,
      iotOptions: ['지문형 출입통제', '도어락'],
      specialOptions: ['층고 3m 이상']
    },
    contactInfo: {
      phoneNumber: '',
      address: '',
      locationType: '',
      hasInternet: ''
    },
    appointment: {
      date: null,
      time: ''
    },
    price: 30000,
    submittedAt: new Date().toISOString()
  };

  console.log('📝 Testing 간편견적 submission (견적 확인하기 clicked)...');
  console.log(`   실내: ${quickEstimateData.currentSelection.indoorCount}대`);
  console.log(`   실외: ${quickEstimateData.currentSelection.outdoorCount}대`);
  console.log(`   IoT: ${quickEstimateData.currentSelection.iotOptions.join(', ')}`);
  console.log(`   특수공사: ${quickEstimateData.currentSelection.specialOptions.join(', ')}`);
  console.log('');

  try {
    const response = await fetch('http://localhost:5001/api/price-estimate/quick', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quickEstimateData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Success:', result.message);
      console.log('\n📊 Please check your Google Sheets:');
      console.log('   Sheet: 간편견적');
      console.log('   The entry should be in ROW 2 (top entry)');
      console.log('   전환: X (not converted - user just viewed estimate)');
    } else {
      console.log('❌ Error:', result.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testQuickEstimateSubmission();
