// Test form submission
const testData = {
  type: 'full',
  converted: true,
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
    iotOptions: ['fingerprint'],
    specialOptions: []
  },
  contactInfo: {
    phoneNumber: '010-1234-5678',
    address: '서울시 강남구',
    locationType: '주택',
    hasInternet: '있음'
  },
  appointment: {
    date: new Date('2026-02-20'),
    time: '10:00'
  },
  price: 23000,
  submittedAt: new Date().toISOString()
};

fetch('http://localhost:5001/api/price-estimate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData),
})
  .then(res => res.json())
  .then(data => console.log('Success:', data))
  .catch(err => console.error('Error:', err));
