// Test daily email notification
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { sendDailyEmailNow } = require('./src/services/dailyEmailScheduler');

const testDailyEmail = async () => {
  console.log('📧 Testing daily email notification...\n');
  
  const success = await sendDailyEmailNow();
  
  if (success) {
    console.log('\n✅ Test completed successfully!');
    console.log('📋 Check your email at: yulialee217@gmail.com');
    console.log('📧 Subject: Daily Update on SALT/KT Contact Forms');
    console.log('\n💡 This email will be automatically sent every day at 7:00 AM NC time.');
  } else {
    console.log('\n❌ Test failed. Please check the logs above.');
  }
};

testDailyEmail();
