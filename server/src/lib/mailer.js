import nodemailer from 'nodemailer';

export const isMailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.MAIL_FROM);

export const getMailConfigSummary = () => ({
  configured: isMailConfigured(),
  host: process.env.SMTP_HOST || '',
  port: Number(process.env.SMTP_PORT || 587),
  secure: String(process.env.SMTP_SECURE || 'false') === 'true',
  from: process.env.MAIL_FROM || '',
  user: process.env.SMTP_USER || '',
});

const buildTransport = () => {
  if (isMailConfigured()) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return null;
};

const transport = buildTransport();

export const verifyMailTransport = async () => {
  if (!transport) {
    return {
      ok: false,
      reason: 'SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and MAIL_FROM.',
    };
  }

  try {
    await transport.verify();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      reason: error.message || 'SMTP verification failed.',
    };
  }
};

export const sendMail = async ({ to, subject, html, text }) => {
  if (!transport) {
    if (process.env.NODE_ENV === 'test') {
      return { messageId: `test-${Date.now()}`, accepted: [to], subject, html, text };
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log('[MAIL_FALLBACK] Transporter not configured. Simulating email send:', {
        to,
        subject,
        text,
      });
      return { messageId: `fallback-${Date.now()}`, accepted: [to], subject, html, text };
    }
    const error = new Error('Email service is not configured on the server.');
    error.code = 'MAIL_NOT_CONFIGURED';
    throw error;
  }

  return transport.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
    text,
  });
};

export const templateOtpEmail = ({ name = 'User', otp = '000000' }) => ({
  subject: 'Verify your email - YunaX',
  text: `Hi ${name}, your YunaX verification code is ${otp}. It expires in 10 minutes.`,
  html: `<p>Hi ${name},</p><p>Your YunaX verification code is <b>${otp}</b>.</p><p>This code expires in 10 minutes.</p>`,
});

export const templateResetOtpEmail = ({ name = 'User', otp = '000000' }) => ({
  subject: 'Verify your password reset - YunaX',
  text: `Hi ${name}, your password reset verification code is ${otp}. It expires in 15 minutes.`,
  html: `<p>Hi ${name},</p><p>Your YunaX password reset verification code is <b>${otp}</b>.</p><p>This code expires in 15 minutes.</p>`,
});

export const normalizeBaseUrl = (value = '') => {
  const origin = String(value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)[0] || 'http://localhost:5173';
  return origin.replace(/\/+$/, '');
};

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const templateResetEmail = ({ name = 'User', token = '', baseUrl = '' }) => {
  const link = `${normalizeBaseUrl(baseUrl)}/reset-password?token=${encodeURIComponent(token)}`;
  const safeName = escapeHtml(name || 'User');
  const safeLink = escapeHtml(link);
  return {
    subject: 'Reset your YunaX password',
    text: `Hi ${name}, reset your YunaX password using this secure link: ${link}. This link expires in 15 minutes. If you did not request this, you can ignore this email.`,
    html: `
      <div style="margin:0;padding:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;">
                <tr>
                  <td style="padding:28px 28px 10px;">
                    <div style="font-size:13px;letter-spacing:0.26em;text-transform:uppercase;color:#0ea5e9;font-weight:700;">YunaX</div>
                    <h1 style="margin:14px 0 8px;font-size:28px;line-height:1.2;color:#0f172a;">Reset your password</h1>
                    <p style="margin:0;color:#64748b;font-size:15px;line-height:1.7;">Hi ${safeName}, we received a request to reset your YunaX account password.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 28px 8px;">
                    <a href="${safeLink}" style="display:inline-block;background:#020617;color:#ffffff;text-decoration:none;border-radius:14px;padding:14px 22px;font-size:15px;font-weight:700;">Reset password</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 28px 28px;">
                    <p style="margin:0 0 12px;color:#64748b;font-size:14px;line-height:1.7;">This secure link expires in <strong>15 minutes</strong> and can only be used once.</p>
                    <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">If the button does not work, copy and paste this link into your browser:<br><a href="${safeLink}" style="color:#0284c7;word-break:break-all;">${safeLink}</a></p>
                    <p style="margin:18px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">If you did not request this reset, you can safely ignore this email.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
  };
};

export const templateOrderPlaced = ({ name = 'Customer', orderId = '' }) => ({
  subject: `Order placed: ${orderId}`,
  text: `Hi ${name}, your order ${orderId} has been placed. Our team will begin processing it shortly.`,
  html: `<p>Hi ${name},</p><p>Your order <b>${orderId}</b> has been placed.</p><p>Our team will begin processing it shortly.</p>`,
});

export const templateOrderPaid = ({ name = 'Customer', orderId = '' }) => ({
  subject: `Payment received: ${orderId}`,
  text: `Hi ${name}, payment for order ${orderId} is confirmed.`,
  html: `<p>Hi ${name},</p><p>Payment for order <b>${orderId}</b> is confirmed.</p>`,
});

export const templateOrderStatus = ({ name = 'Customer', orderId = '', status = '', etaLabel = '', supportEmail = 'info@yunax.com' }) => ({
  subject: `Order update: ${orderId} is ${status}`,
  text: `Hi ${name}, your order ${orderId} status is now ${status}.${etaLabel ? ` Estimated delivery: ${etaLabel}.` : ''} Need help? Contact ${supportEmail}.`,
  html: `<p>Hi ${name},</p><p>Your order <b>${orderId}</b> status is now <b>${status}</b>.</p>${etaLabel ? `<p>Estimated delivery: <b>${etaLabel}</b>.</p>` : ''}<p>Need help? Contact <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>`,
});

export const templateOrderRefunded = ({ name = 'Customer', orderId = '', supportEmail = 'info@yunax.com' }) => ({
  subject: `Refund processed: ${orderId}`,
  text: `Hi ${name}, your refund for order ${orderId} has been processed. For help, contact ${supportEmail}.`,
  html: `<p>Hi ${name},</p><p>Your refund for order <b>${orderId}</b> has been processed.</p><p>For help, contact <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>`,
});
