// templates/masterTemplate.js

exports.generateMasterTemplate = (config = {}) => {
    const {
        company_name = 'ERPICA',
        user_name = 'User',
        message_intro = '',
        event_name = '',
        action = '',
        status,
        action_cta = '',
        actionbutton_text = '',
        actionlink = '', // CTA button
        fallback_note = '',
        action_link = '',  // fallback plain URL
        notes = '',
        details = {},
        currentyear = new Date().getFullYear()
    } = config;

    const statusBadgeClass =
        status === 'Approved' || status === 'Success'
            ? 'status-approved'
            : status === 'Pending'
                ? 'status-pending'
                : status === 'Rejected' || status === 'Failed'
                    ? 'status-rejected'
                    : '';

    const statusBlock =
        Object.prototype.hasOwnProperty.call(config, 'status') &&
            typeof status === 'string' &&
            status.trim().length > 0
            ? `<p><strong>Status:</strong> <span class="status-badge ${statusBadgeClass}">${status}</span></p>`
            : '';


    const actionBlock =
        actionlink && actionbutton_text
            ? `
        <p>${action_cta}</p>
        <a href="${actionlink}" class="button">${actionbutton_text}</a>
        ${fallback_note
                ? `
          <div class="fallback-link">
            <p>${fallback_note}</p>
            <p>Copy and paste this link in your browser:<br><span>${action_link}</span></p>
          </div>
        `
                : ''
            }
      `
            : '';
  const detailsBlock =
    details && typeof details === 'object' && Object.keys(details).length > 0
      ? Object.entries(details)
        .map(([key, value]) => value ? `<p><strong>${key}:</strong> ${value}</p>` : '')
        .join('')
      : '';
    return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${event_name} Notification</title>
    <style>
      /* [Your full CSS remains unchanged — already optimized] */
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #121212;
        margin: 0;
        padding: 0;
      }
      .email-container {
        max-width: 620px;
        margin: 40px auto;
        background-color: #1e1e1e;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        border-top: 6px solid #2196f3;
        overflow: hidden;
        color: #e0e0e0;
      }
      .header {
        background-color: #0d47a1;
        color: #ffffff;
        padding: 32px;
        text-align: center;
        font-size: 24px;
        font-weight: bold;
        letter-spacing: 0.8px;
      }
      .body {
        padding: 32px;
        font-size: 16px;
        line-height: 1.6;
        color: #ffffff;
      }
      .details {
        margin-top: 24px;
        padding: 24px;
        background-color: #263238;
        border-left: 4px solid #2196f3;
        border-radius: 8px;
        color: #e0e0e0;
      }
      .details p {
        margin: 10px 0;
      }
      .details p strong {
        color: #90caf9;
      }
      .status-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 10px;
        font-weight: 600;
        font-size: 13px;
        color: #ffffff;
      }
      .status-approved {
        background-color: #4caf50;
      }
      .status-pending {
        background-color: #ffeb3b;
        color: #212121;
      }
      .status-rejected {
        background-color: #f44336;
      }
      .button {
        display: inline-block;
        margin-top: 24px;
        padding: 12px 24px;
        background-color: #2196f3;
        color: #ffffff;
        text-decoration: none;
        border-radius: 8px;
        font-weight: bold;
        transition: background 0.3s ease;
      }
      .button:hover {
        background-color: #1976d2;
      }
      .fallback-link {
        margin-top: 16px;
        font-size: 13px;
        color: #b0bec5;
      }
      .footer {
        background-color: #212121;
        color: #aaaaaa;
        text-align: center;
        padding: 20px;
        font-size: 12px;
        border-top: 1px solid #424242;
      }
      @media screen and (max-width: 480px) {
        .email-container {
          margin: 20px;
          border-radius: 8px;
        }
        .header {
          font-size: 20px;
          padding: 24px;
        }
        .body {
          padding: 24px;
          font-size: 15px;
        }
        .button {
          padding: 10px 20px;
          font-size: 14px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">${company_name}</div>
      <div class="body">
        <p>Hello <strong>${user_name}</strong>,</p>
        <p>${message_intro}</p>
        <div class="details">
          <p><strong>Event:</strong> ${event_name}</p>
          <p><strong>Action:</strong> ${action}</p>
          ${statusBlock}
          ${detailsBlock}
          ${actionBlock}
          ${notes ? `<p>${notes.replace(/\n/g, "<br>")}</p>` : ''}
        </div>
        <p>Regards,<br><strong>${company_name} Team</strong></p>
      </div>
      <div class="footer">&copy; ${currentyear} ${company_name}. All rights reserved.</div>
    </div>
  </body>
  </html>
  `;
};
