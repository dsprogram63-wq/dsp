import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'brevo-email-dev-proxy',
        configureServer(server) {
          server.middlewares.use('/api/send-email', (req, res) => {
            if (req.method === 'OPTIONS') {
              res.writeHead(200, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With'
              });
              res.end();
              return;
            }

            if (req.method !== 'POST') {
              res.writeHead(405, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }

            let bodyStr = '';
            req.on('data', chunk => {
              bodyStr += chunk;
            });

            req.on('end', async () => {
              try {
                const body = JSON.parse(bodyStr || '{}');
                const apiKey = env.VITE_BREVO_API_KEY || env.BREVO_API_KEY || process.env.VITE_BREVO_API_KEY || process.env.BREVO_API_KEY;
                const senderEmail = env.VITE_BREVO_SENDER_EMAIL || env.BREVO_SENDER_EMAIL || 'work@dsprogram.space';
                const senderName = env.VITE_BREVO_SENDER_NAME || env.BREVO_SENDER_NAME || 'Dahej Support';

                const { to, subject, htmlContent, textContent, sender, replyTo } = body;

                const payload = {
                  sender: sender || { name: senderName, email: senderEmail },
                  to: Array.isArray(to) ? to : [to],
                  subject,
                  htmlContent: htmlContent || `<p>${textContent || ''}</p>`
                };

                if (textContent) payload.textContent = textContent;
                if (replyTo) payload.replyTo = replyTo;

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

                res.writeHead(brevoRes.status, {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify(data));
              } catch (err) {
                console.error('[Vite Brevo Dev Proxy Error]:', err);
                res.writeHead(500, {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*'
                });
                res.end(JSON.stringify({ error: err.message || 'Server error' }));
              }
            });
          });
        }
      }
    ],
    server: {
      port: 5173,
      open: false
    }
  };
});
