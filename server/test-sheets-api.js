require('dotenv').config();
const { getAllSheetEstimates } = require('./src/services/googleSheets');

setTimeout(async () => {
  try {
    console.log('\n📊 Testing Google Sheets API...\n');
    const data = await getAllSheetEstimates();
    console.log('✅ Success!');
    console.log('Quick Estimates:', data.quickEstimates?.length || 0);
    console.log('SALT Consultations:', data.saltConsultations?.length || 0);
    console.log('KT Consultations:', data.ktConsultations?.length || 0);
    console.log('Total:', data.total);
    
    if (data.quickEstimates?.length > 0) {
      console.log('\n첫 번째 간편견적 샘플:');
      const first = data.quickEstimates[0];
      console.log(JSON.stringify(first, null, 2));
    }
    
    if (data.saltConsultations?.length > 0) {
      console.log('\n첫 번째 SALT 상담신청 샘플:');
      const first = data.saltConsultations[0];
      console.log(JSON.stringify(first, null, 2));
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}, 2000);
