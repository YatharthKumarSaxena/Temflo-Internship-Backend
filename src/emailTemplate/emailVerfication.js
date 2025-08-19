exports.emailVerfication = ({
  title = 'Verify your email',
  name = '',
  link = '',
  time = new Date(),
  emailToken,
}) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
                background-color: #f0f2f5;
                margin: 0;
                padding: 20px;
                line-height: 1.6;
            }
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                overflow: hidden;
            }
            .header {
                background-color: #1890ff;
                color: white;
                padding: 32px 24px;
                text-align: center;
            }
            .header h1 {
                font-size: 24px;
                font-weight: 600;
                margin-bottom: 8px;
            }
            .header p {
                font-size: 14px;
                opacity: 0.9;
            }
            .content {
                padding: 32px 24px;
            }
            .greeting {
                font-size: 20px;
                color: #262626;
                margin-bottom: 16px;
                font-weight: 500;
            }
            .message {
                font-size: 16px;
                color: #595959;
                line-height: 1.6;
                margin-bottom: 24px;
            }
            .button-container {
                text-align: center;
                margin: 32px 0;
            }
            .verify-button {
                display: inline-block;
                background-color: #1890ff;
                color: white;
                text-decoration: none;
                padding: 12px 32px;
                border-radius: 6px;
                font-size: 16px;
                font-weight: 500;
                transition: all 0.3s ease;
                box-shadow: 0 2px 0 rgba(0, 0, 0, 0.045);
            }
            .verify-button:hover {
                background-color: #40a9ff;
                box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
                text-decoration: none;
                color: white;
                transform: translateY(-1px);
            }
            .link-fallback {
                font-size: 12px;
                color: #8c8c8c;
                margin-top: 16px;
                padding: 16px;
                background-color: #fafafa;
                border-radius: 4px;
                word-break: break-all;
            }
            .info-box {
                background-color: #e6f7ff;
                border: 1px solid #91d5ff;
                border-radius: 6px;
                padding: 16px;
                margin: 24px 0;
                font-size: 14px;
                color: #1890ff;
            }
            .features-list {
                background-color: #f6ffed;
                border-radius: 6px;
                padding: 20px;
                margin: 24px 0;
            }
            .features-list h3 {
                color: #52c41a;
                font-size: 16px;
                margin-bottom: 12px;
                font-weight: 600;
            }
            .features-list ul {
                list-style: none;
                padding: 0;
            }
            .features-list li {
                color: #595959;
                font-size: 14px;
                margin-bottom: 8px;
                padding-left: 24px;
                position: relative;
            }
            .features-list li:before {
                content: '✓';
                position: absolute;
                left: 0;
                color: #52c41a;
                font-weight: bold;
            }
            .footer {
                background-color: #fafafa;
                padding: 24px;
                text-align: center;
                border-top: 1px solid #f0f0f0;
            }
            .footer p {
                margin: 4px 0;
                color: #8c8c8c;
                font-size: 14px;
            }
            .footer .company {
                color: #262626;
                font-weight: 500;
            }
            .divider {
                height: 1px;
                background-color: #f0f0f0;
                margin: 24px 0;
            }
            @media (max-width: 600px) {
                .email-container {
                    margin: 0;
                    border-radius: 0;
                }
                .content {
                    padding: 24px 16px;
                }
                .header {
                    padding: 24px 16px;
                }
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>Welcome to ERPICA</h1>
                <p>Your Enterprise Resource Planning Solution</p>
            </div>
            
            <div class="content">
                <div class="greeting">Hello ${name}!</div>
                
                <div class="message">
                    Thank you for creating your ERPICA account. To complete your registration and secure your account, please verify your email address by clicking the button below.
                </div>

                <div class="button-container">
                    <a href="${link}" class="verify-button">
                        Verify Email Address
                    </a>
                </div>

                <div class="link-fallback">
                    <strong>Having trouble with the button?</strong><br>
                    Copy and paste this link in your browser:<br>
                    ${link}
                </div>

                <div class="info-box">
                    <strong>Security Notice:</strong> This verification link will expire in 30 minutes for your security. If you didn't create this account, please ignore this email.
                </div>

                <div class="divider"></div>

                <div class="features-list">
                    <h3>What you can do with ERPICA:</h3>
                    <ul>
                        <li>Manage employee records and HR processes</li>
                        <li>Track attendance and leave management</li>
                        <li>Handle asset management and allocations</li>
                        <li>Process expense reports and approvals</li>
                        <li>Organize tasks and project management</li>
                        <li>Generate comprehensive reports and analytics</li>
                    </ul>
                </div>

                <div class="message">
                    Need help? Our support team is here to assist you with any questions about ERPICA.
                </div>
            </div>
            
            <div class="footer">
                <p class="company"><strong>ERPICA Team</strong></p>
                <p>Enterprise Resource Planning Solutions</p>
                <div style="margin-top: 16px;">
                    <p>© ${new Date().getFullYear()} ERPICA. All rights reserved.</p>
                    <p>This email was sent to ${name}</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};

exports.passwordVerfication = ({
  title = 'Reset your Password',
  name = '',
  link = '',
  time = new Date(),
}) => {
  return `
    <div>

        <head data-id="__react-email-head">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <title>${title}</title>
        </head>
        <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Reset your Password<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
        </div>

        <body data-id="__react-email-body">
            <h2 data-id="react-email-heading">${title}</h2>
            <hr data-id="react-email-hr" style="width:100%;border:none;border-top:1px solid #eaeaea" />
            <p data-id="react-email-text" style="font-size:14px;line-height:24px;margin:16px 0">Hello ${name},</p>
            <p data-id="react-email-text" style="font-size:14px;line-height:24px;margin:16px 0">We have received a request to reset the password for your account on IDURAR. To proceed with the password reset, please click on the link provided below:</p>
            <p data-id="react-email-text" style="font-size:14px;line-height:24px;margin:16px 0"><a href="${link}">${link}</a></p>
            <hr data-id="react-email-hr" style="width:100%;border:none;border-top:1px solid #eaeaea" />
            <p data-id="react-email-text" style="font-size:14px;line-height:24px;margin:16px 0">Best regards,</p>
            <p data-id="react-email-text" style="font-size:14px;line-height:24px;margin:16px 0">Salah Eddine Lalami</p>
            <p data-id="react-email-text" style="font-size:14px;line-height:24px;margin:16px 0">Founder @ IDURAR</p>
        </body>
    </div>
    `;
};

exports.afterRegistrationSuccess = ({
  title = 'Customize IDURAR ERP CRM or build your own SaaS',
  name = '',
}) => {
  return `
    <div>

        <head data-id="__react-email-head">
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
            <title>${title}</title>
        </head>
        <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Customize IDURAR or build your own Saas<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
        </div>

        <body data-id="__react-email-body">
            <h2 data-id="react-email-heading">${title}</h2>
            <hr data-id="react-email-hr" style="width:100%;border:none;border-top:1px solid #eaeaea" />
            <p data-id="react-email-text" style="font-size:14px;line-height:24px;margin:16px 0">Hello ${name},</p>
            <p data-id="react-email-text" style="font-size:14px;line-height:24px;margin:16px 0">I would like to invite you to book a call if you need : </p>
            <p data-id="react-email-text" style="font-size:14px;line-height:24px;margin:16px 0"> * Customize or adding new features to IDURAR ERP CRM.</p>
            <p data-id="react-email-text" style="font-size:14px;line-height:24px;margin:16px 0"> * Build your own custom SaaS solution based on IDURAR ERP CRM , With IDURAR SaaS license  ,  instead of investing  in an uncertain developer team. This opportunity allows you to build a tailored SaaS platform that meets your specific business needs.</p>
            <p data-id="react-email-text" style="font-size:14px;line-height:24px;margin:16px 0"> Book a call here  <a href="https://calendly.com/lalami/meeting">https://calendly.com/lalami/meeting</a></p>
            <hr data-id="react-email-hr" style="width:100%;border:none;border-top:1px solid #eaeaea" />
            <p data-id="react-email-text" style="font-size:14px;line-height:24px;margin:16px 0">Best regards,</p>
            <p data-id="react-email-text" style="font-size:14px;line-height:24px;margin:16px 0">Salah Eddine Lalami</p>
            <p data-id="react-email-text" style="font-size:14px;line-height:24px;margin:16px 0">Founder @ IDURAR</p>
        </body>
    </div>
    
    `;
};
