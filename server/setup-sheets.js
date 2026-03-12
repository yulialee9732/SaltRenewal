require('dotenv').config();
const { setupSheetHeaders } = require('./src/services/googleSheets');

setupSheetHeaders()
  .then(() => {
    console.log('✅ Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  });
