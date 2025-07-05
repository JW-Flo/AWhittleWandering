/**
 * Cloudflare Worker: Email Subscription Endpoints
 * 
 * Endpoints:
 *   - POST /email/subscribe   (subscribe a new email)
 *   - POST /email/notify      (admin: trigger notification to all subscribers)
 * 
 * All storage is in Cloudflare KV/D1. Email delivery via SendGrid/Mailgun API.
 */

import { addSubscriber, getSubscriberEmails } from './utils/email-subscribers';
import { sendEmail } from './utils/email-delivery';
import { WorkerEnvironment } from './types/cloudflare';

export async function handleEmailSubscribe(request: Request, env: WorkerEnvironment): Promise<Response> {
  const { email } = await request.json();
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  await addSubscriber(env, email);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}

// Admin endpoint: POST /email/notify
export async function handleEmailNotify(request: Request, env: WorkerEnvironment): Promise<Response> {
  // TODO: Add admin JWT verification
  const { subject, content } = await request.json();
  if (!subject || !content) {
    return new Response(JSON.stringify({ error: 'Missing subject or content' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
  const emails = await getSubscriberEmails(env);
  let sent = 0;
  for (const email of emails) {
    await sendEmail(env, email, subject, content);
    sent++;
  }
  return new Response(JSON.stringify({ ok: true, sent }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });
}
