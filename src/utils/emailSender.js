const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Reusable email sender
 * Works in both modes:
 *  1. Fire-and-forget (just call sendEmail(...))
 *  2. Await mode (await sendEmail(...))
 * 
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email body (HTML allowed)
 * @returns {Promise<boolean>} Resolves true if mail sent successfully, false otherwise
 */
const sendEmail = (to, subject, html) => {
  return transporter
    .sendMail({
      from: `"ERPICA" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html,
    })
    .then(() => {
      console.log(`✅ Email sent to ${to}`);
      return true;
    })
    .catch((err) => {
      console.error('❌ Email send failed:', err);
      return false;
    });
};

module.exports = {
  sendEmail,
};
