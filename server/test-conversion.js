// Test 2: User views estimate AND completes full form (전환: O)
console.log('═══════════════════════════════════════════════════════');
console.log('TEST 2: User completes full consultation form');
console.log('Expected: Entry in SALT 상담신청 AND 간편견적 with 전환: O');
console.log('═══════════════════════════════════════════════════════\n');

const testConversion = async () => {
  const fullFormData = {
    initialSelection: {
      cameraType: '210만',
      indoorCount: 4,
      outdoorCount: 3,
      iotOptions: ['doorlock', 'motion'],
      specialOptions: ['height']
    },
    currentSelection: {
      cameraType: '210만',
      indoorCount: 4,
      outdoorCount: 3,
      iotOptions: ['도어락', '움직임 감지센서'],
      specialOptions: ['층고 3m 이상']
    },
    contactInfo: {
      phoneNumber: '010-1111-2222',
      address: '서울시 강남구 전환테스트',
      locationType: '아파트',
      hasInternet: '있음'
    },
    appointment: {
      date: new Date('2026-02-20'),
      time: '10:00'
    },
    price: 45000,
    submittedAt: new Date().toISOString()
  };

  console.log('📝 Scenario: User completes full form with contact info');
  console.log(`   연락처: ${fullFormData.contactInfo.phoneNumber}`);
  console.log(`   주소: ${fullFormData.contactInfo.address}`);
  console.log(`   실내: ${fullFormData.currentSelection.indoorCount}대, 실외: ${fullFormData.currentSelection.outdoorCount}대\n`);

  try {
    // Step 1: Submit to SALT 상담신청
    const response1 = await fetch('http://localhost:5001/api/price-estimate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fullFormData),
    });

    const result1 = await response1.json();
    
    if (response1.ok) {
      console.log('✅ Step 1 Success:', result1.message);
      console.log('   → Saved to SALT 상담신청\n');
      
      // Step 2: Submit to 간편견적 with converted = true
      const quickFormData = {
        ...fullFormData,
        converted: true
      };
      
      const response2 = await fetch('http://localhost:5001/api/price-estimate/quick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quickFormData),
      });

      const result2 = await response2.json();
      
      if (response2.ok) {
        console.log('✅ Step 2 Success:', result2.message);
        console.log('   → Saved to 간편견적');
        console.log('   → 전환: O (user completed form)\n');
        console.log('🎉 CONVERSION TRACKED SUCCESSFULLY!');
      }
    } else {
      console.log('❌ Error:', result1.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testConversion();
