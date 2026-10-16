/**
 * Vercel Serverless Function: Brevo Mail Sender Proxy
 * Endpoint: /api/send-email
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.VITE_BREVO_API_KEY || process.env.BREVO_API_KEY;
  const senderEmail = process.env.VITE_BREVO_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || 'work@dsprogram.space';
  const senderName = process.env.VITE_BREVO_SENDER_NAME || process.env.BREVO_SENDER_NAME || 'Dahej Support';

  if (!apiKey) {
    return res.status(500).json({ error: 'BREVO_API_KEY environment variable is not configured.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: 'Malformed JSON payload' });
      }
    }

    const { to, subject, htmlContent, textContent, sender, replyTo } = body || {};

    if (!to || !subject || (!htmlContent && !textContent)) {
      return res.status(400).json({ error: 'Missing required email fields (to, subject, content).' });
    }

    const payload = {
      sender: sender || { name: senderName, email: senderEmail },
      to: Array.isArray(to) ? to : [to],
      subject,
      htmlContent: htmlContent || `<p>${textContent || ''}</p>`
    };

    if (textContent) {
      payload.textContent = textContent;
    }

    if (replyTo) {
      payload.replyTo = replyTo;
    }

    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await brevoRes.json().catch(() => ({}));

    if (!brevoRes.ok) {
      console.error('Brevo API Error in /api/send-email:', data);
      return res.status(brevoRes.status).json({
        error: data.message || `Brevo API call failed with status ${brevoRes.status}`,
        details: data
      });
    }

    return res.status(200).json({ success: true, messageId: data.messageId });
  } catch (err) {
    console.error('Server proxy error in /api/send-email:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
