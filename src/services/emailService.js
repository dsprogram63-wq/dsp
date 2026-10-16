/**
 * Dahej Support - Brevo Mailing System & Multi-Sender Service
 * 
 * Features:
 * - Transactional emails via /api/send-email proxy with direct Brevo fallback
 * - Multi-sender registry (work@dsprogram.space, support@..., etc.)
 * - Cryptographically random 6-digit OTP generation
 * - Secure temporary OTP store with 10-minute expiry & rate limiting
 * - Rich branded HTML templates for Developer & Tester verifications
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

// Multi-Sender Registry
export const SENDER_PROFILES = {
  DEFAULT: {
    name: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BREVO_SENDER_NAME) || 'Dahej Support',
    email: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BREVO_SENDER_EMAIL) || 'work@dsprogram.space'
  },
  WORK: {
    name: 'Dahej Support Operations',
    email: 'work@dsprogram.space'
  },
  DEVELOPER_DESK: {
    name: 'Dahej Support Developer Desk',
    email: 'work@dsprogram.space'
  },
  QA_DESK: {
    name: 'Dahej Support QA Desk',
    email: 'work@dsprogram.space'
  }
};

const getApiKey = () => {
  return (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_BREVO_API_KEY || import.meta.env?.BREVO_API_KEY)) || '';
};

/**
 * In-memory, SessionStorage & LocalStorage synchronized OTP store
 * Keyed by normalized lowercase email
 */
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const STORAGE_PREFIX = 'ds_otp_';

export function generateOtpCode() {
  // Generate high-entropy 6-digit number between 100000 and 999999
  const array = new Uint32Array(1);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
    return (100000 + (array[0] % 900000)).toString();
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const memoryOtpStore = new Map();

export function savePendingOtp(email, otpCode, role = 'developer') {
  if (!email) return;
  const key = `${STORAGE_PREFIX}${email.trim().toLowerCase()}`;
  const record = {
    otp: otpCode.toString().trim(),
    role,
    createdAt: Date.now(),
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0
  };

  memoryOtpStore.set(key, record);

  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(key, JSON.stringify(record));
    }
  } catch (e) {}

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(record));
    }
  } catch (e) {}
}

export function verifyOtpCode(email, enteredOtp) {
  if (!email || !enteredOtp) {
    return { success: false, error: 'Email and OTP code are required.' };
  }

  const key = `${STORAGE_PREFIX}${email.trim().toLowerCase()}`;
  let record = memoryOtpStore.get(key);

  if (!record) {
    try {
      if (typeof sessionStorage !== 'undefined') {
        const str = sessionStorage.getItem(key);
        if (str) record = JSON.parse(str);
      }
    } catch (e) {}
  }

  if (!record) {
    try {
      if (typeof localStorage !== 'undefined') {
        const str = localStorage.getItem(key);
        if (str) record = JSON.parse(str);
      }
    } catch (e) {}
  }

  if (!record) {
    return { 
      success: false, 
      error: 'No active OTP found for this email. Please click Send OTP to receive a code on your email.' 
    };
  }

  try {
    // Check expiry
    if (Date.now() > record.expiresAt) {
      memoryOtpStore.delete(key);
      try { sessionStorage.removeItem(key); } catch (e) {}
      try { localStorage.removeItem(key); } catch (e) {}
      return { 
        success: false, 
        error: 'This OTP has expired (10 min limit). Please click Resend OTP.' 
      };
    }

    // Rate limit failed attempts (max 5)
    if (record.attempts >= 5) {
      memoryOtpStore.delete(key);
      try { sessionStorage.removeItem(key); } catch (e) {}
      try { localStorage.removeItem(key); } catch (e) {}
      return {
        success: false,
        error: 'Too many incorrect attempts. Please request a fresh OTP.'
      };
    }

    const cleanInput = enteredOtp.toString().trim();
    if (cleanInput === record.otp) {
      // Valid OTP! Clear it so it cannot be reused
      memoryOtpStore.delete(key);
      try { sessionStorage.removeItem(key); } catch (e) {}
      try { localStorage.removeItem(key); } catch (e) {}
      return { success: true };
    } else {
      record.attempts = (record.attempts || 0) + 1;
      memoryOtpStore.set(key, record);
      try { sessionStorage.setItem(key, JSON.stringify(record)); } catch (e) {}
      try { localStorage.setItem(key, JSON.stringify(record)); } catch (e) {}
      const remainingAttempts = 5 - record.attempts;
      return {
        success: false,
        error: `Incorrect OTP code. Please enter the 6-digit code received on your email. (${remainingAttempts} attempts left)`
      };
    }
  } catch (err) {
    return { success: false, error: 'Failed to verify OTP. Please try again.' };
  }
}

export function clearPendingOtp(email) {
  if (!email) return;
  const key = `${STORAGE_PREFIX}${email.trim().toLowerCase()}`;
  memoryOtpStore.delete(key);
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(key);
    }
  } catch (e) {}
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  } catch (e) {}
}

/**
 * Builds high-converting, professional HTML email for OTP
 */
function buildOtpEmailHtml({ toName, otpCode, role }) {
  const roleTitle = (role === 'tester' || role === 'qa') ? 'QA Tester' : 'Developer';
  const accentColor = (role === 'tester' || role === 'qa') ? '#10B981' : '#0284C7';
  const roleBadge = (role === 'tester' || role === 'qa') ? '🧪 QA TESTER VERIFICATION' : '💻 DEVELOPER VERIFICATION';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dahej Support Verification OTP</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="580" style="max-width: 580px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04); border: 1px solid #E2E8F0;" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Header Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #0F3E6D 0%, #0A2540 100%); padding: 32px 36px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF;">
                DAHEJ <span style="color: #F59E0B;">SUPPORT</span>
              </h1>
              <p style="margin: 6px 0 0 0; color: #94A3B8; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">
                Freelancer & QA Tester Network
              </p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <!-- Role Badge -->
              <div style="display: inline-block; padding: 6px 14px; border-radius: 20px; background-color: #EFF6FF; border: 1px solid #DBEAFE; color: ${accentColor}; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 20px;">
                ${roleBadge}
              </div>

              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0F172A;">
                Email Verification Code
              </h2>

              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                Hello${toName ? ` <strong>${toName}</strong>` : ''},
              </p>

              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Thank you for applying to the <strong>Dahej Support ${roleTitle} Program</strong>. To securely verify your email address and proceed with your application, please use the 6-digit One-Time Password (OTP) below:
              </p>

              <!-- OTP Code Display Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
                <tr>
                  <td align="center" style="background: linear-gradient(145deg, #F0F7FF 0%, #E0F2FE 100%); border: 2px dashed #0284C7; border-radius: 12px; padding: 22px;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #0369A1; margin-bottom: 8px;">
                      Your Verification OTP
                    </div>
                    <div style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #0F3E6D; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;">
                      ${otpCode}
                    </div>
                    <div style="margin-top: 8px; font-size: 12px; color: #64748B;">
                      ⏱️ Valid for <strong>10 minutes</strong>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Notice -->
              <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 12px 16px; border-radius: 4px; margin: 24px 0 16px 0;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #92400E;">
                  <strong>Security Notice:</strong> Never share this OTP with anyone. Dahej Support staff will never ask for your verification code. If you did not initiate this request, you can safely disregard this email.
                </p>
              </div>

              <p style="margin: 20px 0 0 0; font-size: 13px; line-height: 1.6; color: #64748B;">
                Best regards,<br>
                <strong style="color: #0F3E6D;">Dahej Support Onboarding Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F1F5F9; border-top: 1px solid #E2E8F0; padding: 20px 36px; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748B;">
                Sent via Dahej Support Automated Mail Service • Official Sender: <strong style="color: #0F3E6D;">work@dsprogram.space</strong>
              </p>
              <p style="margin: 0; font-size: 11px; color: #94A3B8;">
                © ${new Date().getFullYear()} Dahej Support Freelancer Network. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Generic Transactional Email Sender with Multi-Sender Support
 * Attempts /api/send-email first (handled by Vite dev server or Vercel serverless function),
 * and falls back to direct Brevo API call if proxy is unreachable.
 */
export async function sendTransactionalEmail({
  to,
  subject,
  htmlContent,
  textContent,
  senderProfile = SENDER_PROFILES.DEFAULT,
  replyTo
}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Brevo API key is not configured.');
  }

  const sender = {
    name: senderProfile?.name || SENDER_PROFILES.DEFAULT.name,
    email: senderProfile?.email || SENDER_PROFILES.DEFAULT.email
  };

  const payload = {
    sender,
    to: Array.isArray(to) ? to : [to],
    subject,
    htmlContent,
    replyTo: replyTo || {
      name: 'Dahej Support',
      email: 'work@dsprogram.space'
    }
  };

  if (textContent) {
    payload.textContent = textContent;
  }

  // 1. Try /api/send-email proxy first (prevents browser CORS and client adblocker blocks)
  try {
    const proxyRes = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const contentType = proxyRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await proxyRes.json();
      if (proxyRes.ok && (data.success || data.messageId)) {
        return {
          success: true,
          messageId: data.messageId
        };
      } else if (!proxyRes.ok) {
        console.warn('Proxy returned error, attempting fallback direct call:', data.error);
      }
    }
  } catch (err) {
    console.warn('Proxy request failed, falling back to direct Brevo fetch:', err);
  }

  // 2. Direct Brevo API fallback (strictly using allowed CORS headers: api-key, content-type)
  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('Brevo API Error:', data);
    const errorMsg = data.message || `Failed to send email (Status ${response.status})`;
    throw new Error(errorMsg);
  }

  return {
    success: true,
    messageId: data.messageId
  };
}

/**
 * High-Level Helper: Send OTP Email for Developer / QA Tester Verification
 */
export async function sendOtpVerificationEmail({
  toEmail,
  toName = '',
  role = 'developer',
  senderProfile = SENDER_PROFILES.DEFAULT
}) {
  if (!toEmail) {
    throw new Error('Recipient email is required.');
  }

  // 1. Generate 6-digit OTP
  const otpCode = generateOtpCode();

  // 2. Save OTP for verification (synchronized across memory, session & local storage)
  savePendingOtp(toEmail, otpCode, role);

  // 3. Render HTML template
  const htmlContent = buildOtpEmailHtml({
    toName,
    otpCode,
    role
  });

  const roleTitle = (role === 'tester' || role === 'qa') ? 'QA Tester' : 'Developer';
  const subject = `${otpCode} is your Dahej Support ${roleTitle} Verification Code`;
  const textContent = `Hello ${toName || 'Applicant'},\n\nYour 6-digit verification code for Dahej Support ${roleTitle} Program is: ${otpCode}\n\nThis OTP is valid for 10 minutes. Please enter it on the website to verify your email.\n\nBest regards,\nDahej Support Team\nOfficial Email: work@dsprogram.space`;

  // 4. Send via Brevo
  const result = await sendTransactionalEmail({
    to: {
      email: toEmail.trim(),
      name: toName || `${roleTitle} Applicant`
    },
    subject,
    htmlContent,
    textContent,
    senderProfile
  });

  return {
    success: true,
    messageId: result.messageId,
    email: toEmail.trim()
  };
}
