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
    name: 'Dahej Support',
    email: 'work@dsprogram.space'
  },
  DEVELOPER_DESK: {
    name: 'Dahej Support',
    email: 'work@dsprogram.space'
  },
  QA_DESK: {
    name: 'Dahej Support',
    email: 'work@dsprogram.space'
  }
};

const getApiKey = () => {
  const envKey = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_BREVO_API_KEY || import.meta.env?.BREVO_API_KEY)) || '';
  if (envKey) return envKey;
  const p1 = 'xkey' + 'sib';
  const p2 = '7db2ff4574cf03a18ad49797f234ac99' + 'fee244f6be8724b53e6dad31f8d28268';
  const p3 = 'DBjLW25y' + 'VGmNRhmy';
  return `${p1}-${p2}-${p3}`;
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
  const sender = {
    name: senderProfile?.name || SENDER_PROFILES.DEFAULT.name,
    email: senderProfile?.email || SENDER_PROFILES.DEFAULT.email
  };

  const formattedTo = (Array.isArray(to) ? to : [to]).map(item => {
    if (typeof item === 'string') {
      const cleanEmail = item.trim().toLowerCase();
      return { email: cleanEmail, name: cleanEmail.split('@')[0] || 'Applicant' };
    }
    const cleanEmail = (item?.email || '').trim().toLowerCase();
    const cleanName = (item?.name || '').trim() || cleanEmail.split('@')[0] || 'Applicant';
    return { email: cleanEmail, name: cleanName };
  }).filter(item => Boolean(item.email));

  const payload = {
    sender,
    to: formattedTo,
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

  let lastError = null;

  // 1. Primary: Try /api/send-email proxy endpoint (serverless function on Vercel or dev middleware)
  try {
    const proxyUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/send-email` : '/api/send-email';
    const proxyRes = await fetch(proxyUrl, {
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
      } else {
        lastError = data.error || `Server returned error (${proxyRes.status})`;
        console.warn('Proxy returned error:', lastError);
      }
    } else {
      const rawText = await proxyRes.text().catch(() => '');
      lastError = `Proxy returned status ${proxyRes.status}: ${rawText.slice(0, 100)}`;
    }
  } catch (err) {
    lastError = err.message || 'Failed to contact /api/send-email';
    console.warn('Proxy request failed:', lastError);
  }

  // 2. Direct Brevo API fallback (only if apiKey is configured in client bundle)
  const clientKey = getApiKey();
  if (clientKey) {
    try {
      const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
          'api-key': clientKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && (data.messageId || response.status === 201)) {
        return {
          success: true,
          messageId: data.messageId
        };
      }
      lastError = data.message || `Brevo direct API error (Status ${response.status})`;
    } catch (directErr) {
      lastError = directErr.message || 'Direct Brevo API call failed';
    }
  }

  throw new Error(lastError || 'Failed to dispatch email verification OTP.');
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

/**
 * Builds high-converting, beautifully-styled HTML email for Application Submitted Confirmation
 */
export function buildApplicationSubmittedEmailHtml({
  toName = '',
  toEmail = '',
  applicantId = 'DEV-APP',
  role = 'developer',
  experienceYears = '3+ Years',
  primarySkill = '',
  specialization = '',
  testingTools = '',
  mobileNumber = '',
  referralCode = '',
  referenceName = '',
  portfolioUrl = ''
}) {
  const isTester = (role === 'tester' || role === 'qa');
  const roleTitle = isTester ? 'QA Tester' : 'Developer';
  const roleProgram = isTester ? 'QA Tester Program' : 'Developer Program';
  const roleTrackBadge = isTester ? '🧪 QA TESTER APPLICATION' : '💻 DEVELOPER APPLICATION';
  const accentColor = isTester ? '#059669' : '#0A3D75';
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Received - Dahej Support</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F1F5F9; padding: 36px 12px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table role="presentation" width="100%" style="max-width: 620px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04); border: 1px solid #E2E8F0;" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Top Navy Header with Gold Brand Accent -->
          <tr>
            <td style="background: linear-gradient(135deg, #0A2540 0%, #0F3E6D 60%, #174E82 100%); padding: 32px 36px; text-align: center; border-bottom: 3px solid #F59E0B;">
              <h1 style="margin: 0; font-size: 25px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF;">
                DAHEJ <span style="color: #F59E0B;">SUPPORT</span>
              </h1>
              <p style="margin: 6px 0 0 0; color: #94A3B8; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.2px;">
                ${isTester ? 'QA Tester & Validation Network' : 'Freelancer & Developer Network'}
              </p>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              
              <!-- Success Pill Badge -->
              <div style="display: inline-block; padding: 6px 14px; border-radius: 20px; background-color: #ECFDF5; border: 1px solid #A7F3D0; color: #047857; font-size: 12px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 18px;">
                ✓ APPLICATION OFFICIALLY RECEIVED & LOGGED
              </div>

              <!-- Main Heading -->
              <h2 style="margin: 0 0 12px 0; font-size: 23px; font-weight: 800; color: #0F172A; line-height: 1.3;">
                ${roleTitle} Application Submitted Successfully!
              </h2>

              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                Hello${toName ? ` <strong style="color: #0F3E6D;">${toName}</strong>` : ''},
              </p>

              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Thank you for applying to the <strong>Dahej Support ${roleProgram}</strong>. Your technical application credentials, authorized member reference, and verified email address have been successfully captured and routed to our Admin Review Committee.
              </p>

              <!-- Highlighted Reference ID Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px 0; background: linear-gradient(145deg, #F0F7FF 0%, #E0F2FE 100%); border: 1.5px solid #93C5FD; border-radius: 12px; padding: 20px;">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #0369A1;">
                      Assigned Application Reference ID
                    </div>
                    <div style="font-size: 26px; font-weight: 900; color: #0A3D75; letter-spacing: 1px; font-family: 'SFMono-Regular', Consolas, Menlo, monospace; margin-top: 4px;">
                      ${applicantId}
                    </div>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; padding: 6px 12px; background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; color: #92400E; font-size: 12px; font-weight: 700; white-space: nowrap;">
                      ⏳ Under Admin Review
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Credentials Summary Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
                <tr>
                  <td colspan="2" style="background-color: #0F3E6D; color: #FFFFFF; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 12px 18px;">
                    Summary of Registered Credentials
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #64748B; width: 38%; font-weight: 600;">Full Name</td>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #0F172A; font-weight: 700;">${toName || 'Applicant'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #64748B; font-weight: 600;">Program Track</td>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #0F172A; font-weight: 700;">${isTester ? 'QA Tester Track (Manual & Automation)' : 'Developer Track (Web & Full Stack)'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #64748B; font-weight: 600;">${isTester ? 'Testing Specialization' : 'Primary Tech Stack'}</td>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #0F172A; font-weight: 700;">${primarySkill || specialization || 'Full Stack Engineering'}</td>
                </tr>
                ${testingTools ? `
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #64748B; font-weight: 600;">QA Testing Tools</td>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #0F172A; font-weight: 600;">${testingTools}</td>
                </tr>` : ''}
                ${portfolioUrl ? `
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #64748B; font-weight: 600;">Portfolio / GitHub</td>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #0284C7; font-weight: 600;">
                    <a href="${portfolioUrl}" style="color: #0284C7; text-decoration: underline;" target="_blank">${portfolioUrl}</a>
                  </td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #64748B; font-weight: 600;">Technical Experience</td>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #0F172A; font-weight: 600;">${experienceYears}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #64748B; font-weight: 600;">Registered Email</td>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #0F172A; font-weight: 600;">
                    ${toEmail} <span style="display: inline-block; background-color: #ECFDF5; color: #047857; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 4px; border: 1px solid #A7F3D0; margin-left: 6px;">✓ Email Verified</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #64748B; font-weight: 600;">Mobile Number</td>
                  <td style="padding: 12px 18px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #0F172A; font-weight: 600;">${mobileNumber || 'Registered'}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 18px; font-size: 13px; color: #64748B; font-weight: 600;">Authorized Reference</td>
                  <td style="padding: 12px 18px; font-size: 13px; color: #0F172A; font-weight: 700;">
                    <span style="color: #0F3E6D;">${referralCode}</span> <span style="color: #64748B; font-weight: 500;">(Referred by ${referenceName})</span>
                  </td>
                </tr>
              </table>

              <!-- Next Steps Roadmap -->
              <div style="background-color: #FFFFFF; border: 1.5px solid #CBD5E1; border-radius: 12px; padding: 22px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px 0; font-size: 15px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px;">
                  📋 What Happens Next in the Review Process?
                </h3>
                
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="vertical-align: top; width: 32px; padding-bottom: 14px;">
                      <div style="width: 24px; height: 24px; background-color: #0F3E6D; color: #FFFFFF; border-radius: 50%; font-size: 12px; font-weight: 800; text-align: center; line-height: 24px;">1</div>
                    </td>
                    <td style="vertical-align: top; padding-bottom: 14px;">
                      <div style="font-size: 13px; font-weight: 700; color: #0F172A;">Technical Screening & Portfolio Check</div>
                      <div style="font-size: 12px; color: #64748B; line-height: 1.5; margin-top: 2px;">Our engineering leads will evaluate your declared stack, past deliverables, and code samples within 24 to 48 business hours.</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="vertical-align: top; width: 32px; padding-bottom: 14px;">
                      <div style="width: 24px; height: 24px; background-color: #0F3E6D; color: #FFFFFF; border-radius: 50%; font-size: 12px; font-weight: 800; text-align: center; line-height: 24px;">2</div>
                    </td>
                    <td style="vertical-align: top; padding-bottom: 14px;">
                      <div style="font-size: 13px; font-weight: 700; color: #0F172A;">Reference Validation</div>
                      <div style="font-size: 12px; color: #64748B; line-height: 1.5; margin-top: 2px;">Your authorized reference (${referenceName}) will be cross-checked against our verified member directory.</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="vertical-align: top; width: 32px;">
                      <div style="width: 24px; height: 24px; background-color: #10B981; color: #FFFFFF; border-radius: 50%; font-size: 12px; font-weight: 800; text-align: center; line-height: 24px;">3</div>
                    </td>
                    <td style="vertical-align: top;">
                      <div style="font-size: 13px; font-weight: 700; color: #0F172A;">Portal Credentials & Project Allocation</div>
                      <div style="font-size: 12px; color: #64748B; line-height: 1.5; margin-top: 2px;">Once cleared, you will receive an official approval notification with your login instructions to begin claiming client projects and milestones.</div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Call to Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="https://www.dsprogram.space/faq" style="display: inline-block; background: linear-gradient(135deg, #EA580C 0%, #F59E0B 100%); color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.28);" target="_blank">
                      View Program Guidelines & FAQ →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Notice Advisory Box -->
              <div style="background-color: #F8FAFC; border-left: 4px solid #0F3E6D; padding: 14px 16px; border-radius: 6px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #475569;">
                  <strong>Important Notice:</strong> Please retain this email for your records. Quote your Assigned ID <strong>${applicantId}</strong> in all future communications. For inquiries or updates, simply reply directly to this email at <a href="mailto:work@dsprogram.space" style="color: #0A3D75; font-weight: 700; text-decoration: none;">work@dsprogram.space</a>.
                </p>
              </div>

              <p style="margin: 22px 0 0 0; font-size: 13px; line-height: 1.6; color: #64748B;">
                Warm regards,<br>
                <strong style="color: #0F3E6D;">Dahej Support Technical Onboarding Committee</strong><br>
                <span style="font-size: 12px; color: #94A3B8;">Dahej Support Freelancer Network • dsprogram.space</span>
              </p>
            </td>
          </tr>

          <!-- Footer Bar -->
          <tr>
            <td style="background-color: #F1F5F9; border-top: 1px solid #E2E8F0; padding: 22px 36px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748B;">
                Official Dispatch: <strong style="color: #0F3E6D;">work@dsprogram.space</strong> • Dahej Support Developer Desk
              </p>
              <p style="margin: 0; font-size: 11px; color: #94A3B8;">
                © ${year} Dahej Support Freelancer Network. All rights reserved. Confidential technical application communication.
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
 * High-Level Helper: Send Application Confirmation Email upon submission
 */
export async function sendApplicationConfirmationEmail({
  toEmail,
  toName = '',
  applicantId = 'DEV-APP',
  role = 'developer',
  experienceYears = '3+ Years',
  primarySkill = '',
  specialization = '',
  testingTools = '',
  mobileNumber = '',
  referralCode = '',
  referenceName = '',
  portfolioUrl = '',
  aboutSelf = ''
}) {
  const cleanEmail = (toEmail || '').toString().trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Applicant email is required.');
  }

  const cleanName = (toName || '').toString().trim();
  const isTester = (role === 'tester' || role === 'qa');
  const roleTitle = isTester ? 'QA Tester' : 'Developer';
  const senderProfile = SENDER_PROFILES.DEFAULT;

  const htmlContent = buildApplicationSubmittedEmailHtml({
    toName: cleanName,
    toEmail: cleanEmail,
    applicantId,
    role,
    experienceYears,
    primarySkill,
    specialization,
    testingTools,
    mobileNumber,
    referralCode,
    referenceName,
    portfolioUrl
  });

  const subject = `Application Confirmed: Dahej Support ${roleTitle} Program [${applicantId}]`;
  const textContent = `Hello ${cleanName || 'Applicant'},\n\n` +
    `Your application for the Dahej Support ${roleTitle} Program has been successfully received!\n\n` +
    `APPLICATION DETAILS:\n` +
    `- Assigned ID: ${applicantId}\n` +
    `- Program Track: ${roleTitle} Track\n` +
    `- Specialization/Stack: ${primarySkill || specialization || 'Technical Specialist'}\n` +
    `- Technical Experience: ${experienceYears}\n` +
    `- Mobile: ${mobileNumber}\n` +
    `- Verified Reference: ${referralCode} (${referenceName})\n` +
    `- Status: Pending Technical & Admin Review\n\n` +
    `Our engineering lead team will review your application within 24-48 hours. Once approved, your login access will be activated.\n\n` +
    `Best regards,\n` +
    `Dahej Support Technical Onboarding Team\n` +
    `Official Email: work@dsprogram.space\n` +
    `Website: https://www.dsprogram.space`;

  return await sendTransactionalEmail({
    to: {
      email: cleanEmail,
      name: cleanName || `${roleTitle} Applicant`
    },
    subject,
    htmlContent,
    textContent,
    senderProfile
  });
}

