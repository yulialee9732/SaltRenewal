const cron = require('node-cron');
const { sendDailySummary } = require('./emailService');
const { getDailyStatistics } = require('./googleSheets');

// Schedule daily email at 7:00 AM North Carolina time (America/New_York)
const scheduleDailyEmail = () => {
  // Cron format: minute hour day month day-of-week
  // '0 7 * * *' = Every day at 7:00 AM
  cron.schedule('0 7 * * *', async () => {
    console.log('📧 Running daily email job at 7:00 AM NC time...');
    
    try {
      const stats = await getDailyStatistics();
      
      if (stats) {
        await sendDailySummary(stats);
        console.log('✅ Daily summary email sent successfully');
      } else {
        console.error('❌ Failed to get daily statistics');
      }
    } catch (error) {
      console.error('❌ Error in daily email job:', error.message);
    }
  }, {
    scheduled: true,
    timezone: "America/New_York"
  });

  console.log('✅ Daily email scheduler initialized (7:00 AM NC time)');
};

// Manual trigger for testing
const sendDailyEmailNow = async () => {
  console.log('📧 Manually triggering daily email...');
  
  try {
    const stats = await getDailyStatistics();
    
    if (stats) {
      await sendDailySummary(stats);
      console.log('✅ Daily summary email sent successfully');
      return true;
    } else {
      console.error('❌ Failed to get daily statistics');
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending daily email:', error.message);
    return false;
  }
};

module.exports = {
  scheduleDailyEmail,
  sendDailyEmailNow
};
