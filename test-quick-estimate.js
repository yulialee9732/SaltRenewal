// Test script to verify 간편견적 endpoint
const testQuickEstimate = async () => {
  const testData = {
    initialSelection: {
      cameraType: '네트워크',
      indoorCount: 2,
      outdoorCount: 1
    },
    currentSelection: {
      cameraType: '네트워크',
      indoorCount: 2,
      outdoorCount: 1,
      iotOptions: ['도어락'],
      specialOptions: ['전기공사']
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
    price: 500000,
    submittedAt: new Date().toISOString()
  };

  try {
    const response = await fetch('http://localhost:5001/api/price-estimate/quick', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    const result = await response.json();
    console.log('\n📊 Response:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ SUCCESS: 간편견적 saved successfully!');
      console.log('   Check your Google Sheet for a new entry in 간편견적 tab');
    } else {
      console.log('❌ FAILED:', result.message);
    }
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
};

testQuickEstimate();
