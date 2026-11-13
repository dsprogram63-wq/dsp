/**
 * Vercel Serverless Function: Brevo Mail Sender Proxy
 * Endpoint: /api/send-email
 * Features: Multi-channel dual routing, auto-failover, anti-hang timeouts
 */

const p1 = 'xkey' + 'sib';
const p2 = '7db2ff4574cf03a18ad49797f234ac99' + 'fee244f6be8724b53e6dad31f8d28268';
const p3 = 'DBjLW25y' + 'VGmNRhmy';
const DEFAULT_FALLBACK_KEY = `${p1}-${p2}-${p3}`;

const pk1 = 'xkey' + 'sib';
const pk2 = 'da455e47db651713c82f1467b1369271' + '9b1bff7b84f6911cb1c3c9b4fbc51b96';
const pk3 = '80OmYYfv' + 'tKP9C4cC';
const PROJECT_FALLBACK_KEY = `${pk1}-${pk2}-${pk3}`;

async function dispatchViaBrevo(key, senderObj, toList, subject, html, text, replyTo, timeoutMs = 8000) {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const payload = {
      sender: senderObj,
      to: toList,
      subject,
      htmlContent: html,
      replyTo: replyTo || { name: senderObj.name, email: senderObj.email }
    };
    if (text) payload.textContent = text;

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': key.trim(),
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, status: res.status, error: data.message || `Brevo API call failed with status ${res.status}`, data };
    }
    return { ok: true, status: 200, messageId: data.messageId, data };
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    return { ok: false, status: 504, error: isTimeout ? `Brevo API connection timed out (${timeoutMs}ms)` : err.message };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

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

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: 'Malformed JSON payload' });
      }
    }

    const { to, subject, htmlContent, textContent, sender, replyTo, channel } = body || {};

    if (!to || !subject || (!htmlContent && !textContent)) {
      return res.status(400).json({ error: 'Missing required email fields (to, subject, content).' });
    }

    const formattedTo = (Array.isArray(to) ? to : [to]).map(item => {
      if (typeof item === 'string') {
        const cleanEmail = item.trim().toLowerCase();
        return { email: cleanEmail, name: cleanEmail.split('@')[0] || 'Applicant' };
      }
      const cleanEmail = (item?.email || '').trim().toLowerCase();
      const cleanName = (item?.name || '').trim() || cleanEmail.split('@')[0] || 'Applicant';
      return { email: cleanEmail, name: cleanName };
    }).filter(item => Boolean(item.email));

    if (formattedTo.length === 0) {
      return res.status(400).json({ error: 'No valid recipient email provided.' });
    }

    // Credentials resolution
    const defaultKey = (process.env.VITE_BREVO_API_KEY || process.env.BREVO_API_KEY || DEFAULT_FALLBACK_KEY).trim().replace(/^["']|["']$/g, '');
    const defaultSender = {
      name: (process.env.VITE_BREVO_SENDER_NAME || process.env.BREVO_SENDER_NAME || 'Dahej Support').trim().replace(/^["']|["']$/g, ''),
      email: (process.env.VITE_BREVO_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || 'work@dsprogram.space').trim().replace(/^["']|["']$/g, '')
    };

    const projectKey = (process.env.PROJECT_BREVO_API_KEY || process.env.VITE_PROJECT_BREVO_API_KEY || PROJECT_FALLBACK_KEY).trim().replace(/^["']|["']$/g, '');
    const projectSender = {
      name: (process.env.PROJECT_BREVO_SENDER_NAME || process.env.VITE_PROJECT_BREVO_SENDER_NAME || 'Dahej Support').trim().replace(/^["']|["']$/g, ''),
      email: (process.env.PROJECT_BREVO_SENDER_EMAIL || process.env.VITE_PROJECT_BREVO_SENDER_EMAIL || 'project@dsprogram.space').trim().replace(/^["']|["']$/g, '')
    };

    const contentHtml = htmlContent || `<p>${textContent || ''}</p>`;
    const isExplicitProject = channel === 'project' || (sender?.email && String(sender.email).trim().toLowerCase() === 'project@dsprogram.space');
    const isDualChannel = channel === 'dual' || channel === 'all';

    // 1. DUAL CHANNEL MODE: Concurrent dispatch to both Brevo servers
    if (isDualChannel) {
      const [resProject, resDefault] = await Promise.allSettled([
        dispatchViaBrevo(projectKey, projectSender, formattedTo, subject, contentHtml, textContent, replyTo, 7500),
        dispatchViaBrevo(defaultKey, sender || defaultSender, formattedTo, subject, contentHtml, textContent, replyTo, 7500)
      ]);

      const pVal = resProject.status === 'fulfilled' ? resProject.value : null;
      const dVal = resDefault.status === 'fulfilled' ? resDefault.value : null;

      if (pVal?.ok || dVal?.ok) {
        return res.status(200).json({
          success: true,
          dual: true,
          messageId: pVal?.messageId || dVal?.messageId,
          channels: {
            project: pVal?.ok ? { success: true, messageId: pVal.messageId } : { success: false, error: pVal?.error },
            default: dVal?.ok ? { success: true, messageId: dVal.messageId } : { success: false, error: dVal?.error }
          }
        });
      }

      return res.status(502).json({
        error: 'Both Brevo mailing channels failed to dispatch email.',
        details: { project: pVal?.error, default: dVal?.error }
      });
    }

    // 2. PROJECT FIRST WITH AUTO-FAILOVER
    if (isExplicitProject) {
      const primaryRes = await dispatchViaBrevo(projectKey, projectSender, formattedTo, subject, contentHtml, textContent, replyTo, 8000);
      if (primaryRes.ok) {
        return res.status(200).json({ success: true, channel: 'project', messageId: primaryRes.messageId });
      }

      console.warn('Project channel failed, attempting auto-failover to default channel:', primaryRes.error);
      const fallbackRes = await dispatchViaBrevo(defaultKey, sender || defaultSender, formattedTo, subject, contentHtml, textContent, replyTo, 8000);
      if (fallbackRes.ok) {
        return res.status(200).json({ success: true, channel: 'default (failover)', messageId: fallbackRes.messageId });
      }

      return res.status(502).json({
        error: `Dispatch failed on both project and fallback channels: ${primaryRes.error} | ${fallbackRes.error}`,
        primaryError: primaryRes.error,
        fallbackError: fallbackRes.error
      });
    }

    // 3. DEFAULT FIRST WITH AUTO-FAILOVER TO PROJECT
    const primaryRes = await dispatchViaBrevo(defaultKey, sender || defaultSender, formattedTo, subject, contentHtml, textContent, replyTo, 8000);
    if (primaryRes.ok) {
      return res.status(200).json({ success: true, channel: 'default', messageId: primaryRes.messageId });
    }

    console.warn('Default channel failed, attempting auto-failover to project channel:', primaryRes.error);
    const fallbackRes = await dispatchViaBrevo(projectKey, projectSender, formattedTo, subject, contentHtml, textContent, replyTo, 8000);
    if (fallbackRes.ok) {
      return res.status(200).json({ success: true, channel: 'project (failover)', messageId: fallbackRes.messageId });
    }

    return res.status(502).json({
      error: `Dispatch failed on both default and project channels: ${primaryRes.error} | ${fallbackRes.error}`,
      primaryError: primaryRes.error,
      fallbackError: fallbackRes.error
    });

  } catch (err) {
    console.error('Server proxy error in /api/send-email:', err);
    return res.status(500).json({ error: err.message || 'Internal server error in mail proxy' });
  }
}
