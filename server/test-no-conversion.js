// Test 1: User views estimate but doesn't complete form (전환: X)
console.log('═══════════════════════════════════════════════════════');
console.log('TEST 1: User clicks "견적 확인하기" and then "처음부터"');
console.log('Expected: Entry in 간편견적 with 전환: X');
console.log('═══════════════════════════════════════════════════════\n');

const testNoConversion = async () => {
  const quickEstimateData = {
    initialSelection: {
      cameraType: '210만',
      indoorCount: 2,
      outdoorCount: 1,
      iotOptions: ['fingerprint'],
      specialOptions: []
    },
    currentSelection: {
      cameraType: '210만',
      indoorCount: 2,
      outdoorCount: 1,
      iotOptions: ['지문형 출입통제'],
      specialOptions: []
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
    price: 20000,
    submittedAt: new Date().toISOString()
  };

  console.log('📝 Scenario: User views price but clicks "처음부터" (restart)');
  console.log(`   실내: ${quickEstimateData.currentSelection.indoorCount}대`);
  console.log(`   실외: ${quickEstimateData.currentSelection.outdoorCount}대\n`);

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
      console.log('   → Entry saved to 간편견적');
      console.log('   → 전환: X (user did not complete form)\n');
    } else {
      console.log('❌ Error:', result.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testNoConversion();
