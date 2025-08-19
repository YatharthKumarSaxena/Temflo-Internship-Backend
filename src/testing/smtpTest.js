console.log('Hello');

require('dotenv').config();
const sendEmail = require('../utils/emailSender');

console.log('✅ Test script started');

(async () => {
  const success = await sendEmail(
    'test@example.com', // Replace with test receiver email
    '✅ SMTP Test – Temflo',
    '<h2>Hello from Temflo SMTP setup!</h2><p>If you received this, SMTP is working fine 🎉</p>'
  );

  if (success) {
    console.log('✅ Test mail successfully sent!');
  } else {
    console.log('❌ Test mail failed.');
  }
})();
