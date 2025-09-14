console.log('Hello');

require('dotenv').config();
const {sendEmail} = require('../utils/emailSender');
const { generateMasterTemplate } = require("../emailTemplate/masterTemplate");
const { masterTemplate } = require("../config/emailTemplate");

console.log('✅ Test script started');

const testEmail = 'yatharthsaxena25@gmail.com'; // Replace with your test email

const templateKeys = Object.keys(masterTemplate);

(async () => {
  for (const key of templateKeys) {
    const config = {
      ...masterTemplate[key],
      user_name: 'Yatharth Kumar Saxena',
      action_cta: masterTemplate[key].action_cta || 'Click below to view details.',
    };

    const html = generateMasterTemplate(config);

    const success = await sendEmail(testEmail, config.subject, html);

    if (success) {
      console.log(`✅ ${key} mail sent successfully!`);
    } else {
      console.log(`❌ ${key} mail failed.`);
    }

    // Optional: Add delay between sends to avoid spam filters
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
})();
