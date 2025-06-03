/**
 * Email delivery utility for Cloudflare Workers.
 * Uses SendGrid or Mailgun HTTP API for production email delivery.
 * 
 * Method:
 *   - sendEmail(env, to, subject, content): Promise<void>
 */

import { WorkerEnvironment } from '../types/cloudflare';

export async function sendEmail(env: WorkerEnvironment, to: string, subject: string, content: string): Promise<void> {
  // Example: SendGrid API
  const SENDGRID_API_KEY = env.SENDGRID_API_KEY;
  const FROM_EMAIL = env.FROM_EMAIL || 'noreply@continentalusa.com';

  if (!SENDGRID_API_KEY) throw new Error('SENDGRID_API_KEY not set in environment');

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: FROM_EMAIL },
      subject,
      content: [{ type: 'text/plain', value: content }]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`SendGrid error: ${res.status} - ${errText}`);
  }
}
