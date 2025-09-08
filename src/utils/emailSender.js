// utils/emailSender.js
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
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email body (HTML allowed)
 * @returns {boolean} true if mail sent successfully, false otherwise
 */
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"ERPICA" <${process.env.SMTP_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}`);
    return true;
  } catch (err) {
    console.error('❌ Email send failed:', err);
    return false;
  }
};

module.exports = sendEmail;
