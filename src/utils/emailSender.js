// zeptomailSender.js

const { SendMailClient } = require("zeptomail");

const url = "api.zeptomail.in/"; // no trailing slash
const token = process.env.ZEPTOMAIL_API_KEY; // store your API key in .env

const client = new SendMailClient({ url, token });

/**
 * Send email using ZeptoMail API
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 * @returns {Promise<boolean>}
 */
const sendEmail = async (to, subject, html) => {
  try {
    const response = await client.sendMail({
      from: {
        address: process.env.SMTP_EMAIL, // should be a verified sender
        name: "ERPICA"
      },
      to: [
        {
          email_address: {
            address: to,
            name: to.split("@")[0]
          }
        }
      ],
      subject,
      htmlbody: html
    });

    console.log("✅ Email sent to:", to);
    return true;
  } catch (error) {
    console.log(error)
    console.error("❌ Email send failed:", error.response?.data || error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
};
