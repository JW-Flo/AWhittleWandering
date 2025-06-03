/**
 * Email subscriber storage for Cloudflare Workers.
 * Uses KV or D1 for persistent, production-grade storage.
 * 
 * Methods:
 *   - getSubscribers(env): Promise<EmailSubscriber[]>
 *   - getSubscriberEmails(env): Promise<string[]>
 *   - getSubscriberByEmail(env, email): Promise<EmailSubscriber | null>
 *   - addSubscriber(env, email, preferences?): Promise<EmailSubscriber>
 *   - updateSubscriber(env, email, updates): Promise<EmailSubscriber | null>
 *   - verifySubscriber(env, email, token): Promise<boolean>
 *   - removeSubscriber(env, email): Promise<boolean>
 */

import { 
  EmailSubscriber, 
  EmailPreference, 
  generateVerificationToken, 
  getDefaultPreferences,
  validateEmail
} from '../../../shared/models/email-subscription';
import { WorkerEnvironment } from '../types/cloudflare';

const SUBSCRIBERS_KEY = 'email_subscribers';

/**
 * Get all subscribers with their full profiles
 */
export async function getSubscribers(env: WorkerEnvironment): Promise<EmailSubscriber[]> {
  if (env.DB) {
    // D1 (Cloudflare SQLite)
    const result = await env.DB.prepare(`
      SELECT 
        email, 
        date_added AS dateAdded, 
        preferences, 
        verification_token AS verificationToken, 
        verified,
        last_email_sent AS lastEmailSent
      FROM subscribers
    `).all<any>();
    
    return result.results.map((row: any) => ({
      email: row.email,
      dateAdded: row.dateAdded,
      preferences: typeof row.preferences === 'string' 
        ? JSON.parse(row.preferences) 
        : row.preferences || getDefaultPreferences(),
      verificationToken: row.verificationToken,
      verified: row.verified === 1,
      lastEmailSent: row.lastEmailSent
    }));
  } else if (env.TESLA_KV) {
    // KV
    const raw = await env.TESLA_KV.get(SUBSCRIBERS_KEY, 'json');
    return Array.isArray(raw) ? raw : [];
  }
  throw new Error('No subscriber storage configured');
}

/**
 * Get just email addresses for all subscribers
 */
export async function getSubscriberEmails(env: WorkerEnvironment): Promise<string[]> {
  if (env.DB) {
    // D1 (Cloudflare SQLite)
    const result = await env.DB.prepare('SELECT email FROM subscribers WHERE verified = 1').all<{ email: string }>();
    return result.results.map((row: { email: string }) => row.email);
  } else if (env.TESLA_KV) {
    // KV
    const subscribers = await getSubscribers(env);
    return subscribers.filter(s => s.verified).map(s => s.email);
  }
  throw new Error('No subscriber storage configured');
}

/**
 * Get a specific subscriber by email
 */
export async function getSubscriberByEmail(env: WorkerEnvironment, email: string): Promise<EmailSubscriber | null> {
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }

  if (env.DB) {
    // D1
    const result = await env.DB.prepare(`
      SELECT 
        email, 
        date_added AS dateAdded, 
        preferences, 
        verification_token AS verificationToken, 
        verified,
        last_email_sent AS lastEmailSent
      FROM subscribers
      WHERE email = ?
    `).bind(email).get<any>();
    
    if (!result) return null;
    
    return {
      email: result.email,
      dateAdded: result.dateAdded,
      preferences: typeof result.preferences === 'string' 
        ? JSON.parse(result.preferences) 
        : result.preferences || getDefaultPreferences(),
      verificationToken: result.verificationToken,
      verified: result.verified === 1,
      lastEmailSent: result.lastEmailSent
    };
  } else if (env.TESLA_KV) {
    // KV
    const subscribers = await getSubscribers(env);
    return subscribers.find(s => s.email === email) || null;
  }
  throw new Error('No subscriber storage configured');
}

/**
 * Add a new subscriber
 */
export async function addSubscriber(
  env: WorkerEnvironment, 
  email: string, 
  preferences: EmailPreference = getDefaultPreferences()
): Promise<EmailSubscriber> {
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }

  const verificationToken = generateVerificationToken();
  const dateAdded = new Date().toISOString();
  
  const subscriber: EmailSubscriber = {
    email,
    dateAdded,
    preferences,
    verificationToken,
    verified: false
  };

  if (env.DB) {
    // D1
    await env.DB.prepare(`
      INSERT OR IGNORE INTO subscribers (
        email, 
        date_added, 
        preferences, 
        verification_token, 
        verified
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      email,
      dateAdded,
      JSON.stringify(preferences),
      verificationToken,
      0
    ).run();
  } else if (env.TESLA_KV) {
    // KV
    const subscribers = await getSubscribers(env);
    const existingIndex = subscribers.findIndex(s => s.email === email);
    
    if (existingIndex >= 0) {
      subscribers[existingIndex] = subscriber;
    } else {
      subscribers.push(subscriber);
    }
    
    await env.TESLA_KV.put(SUBSCRIBERS_KEY, JSON.stringify(subscribers));
  } else {
    throw new Error('No subscriber storage configured');
  }

  return subscriber;
}

/**
 * Update an existing subscriber
 */
export async function updateSubscriber(
  env: WorkerEnvironment, 
  email: string, 
  updates: Partial<EmailSubscriber>
): Promise<EmailSubscriber | null> {
  const subscriber = await getSubscriberByEmail(env, email);
  if (!subscriber) return null;

  const updated = { ...subscriber, ...updates };
  
  if (env.DB) {
    // D1
    await env.DB.prepare(`
      UPDATE subscribers SET
        preferences = ?,
        verification_token = ?,
        verified = ?,
        last_email_sent = ?
      WHERE email = ?
    `).bind(
      JSON.stringify(updated.preferences),
      updated.verificationToken,
      updated.verified ? 1 : 0,
      updated.lastEmailSent || null,
      email
    ).run();
  } else if (env.TESLA_KV) {
    // KV
    const subscribers = await getSubscribers(env);
    const index = subscribers.findIndex(s => s.email === email);
    
    if (index >= 0) {
      subscribers[index] = updated;
      await env.TESLA_KV.put(SUBSCRIBERS_KEY, JSON.stringify(subscribers));
    }
  } else {
    throw new Error('No subscriber storage configured');
  }

  return updated;
}

/**
 * Verify a subscriber using their token
 */
export async function verifySubscriber(env: WorkerEnvironment, email: string, token: string): Promise<boolean> {
  const subscriber = await getSubscriberByEmail(env, email);
  if (!subscriber || subscriber.verificationToken !== token) return false;
  
  await updateSubscriber(env, email, { verified: true, verificationToken: undefined });
  return true;
}

/**
 * Remove a subscriber
 */
export async function removeSubscriber(env: WorkerEnvironment, email: string): Promise<boolean> {
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }

  if (env.DB) {
    // D1
    const result = await env.DB.prepare('DELETE FROM subscribers WHERE email = ?')
      .bind(email)
      .run();
    return result.changes > 0;
  } else if (env.TESLA_KV) {
    // KV
    const subscribers = await getSubscribers(env);
    const filteredSubscribers = subscribers.filter(s => s.email !== email);
    
    if (filteredSubscribers.length < subscribers.length) {
      await env.TESLA_KV.put(SUBSCRIBERS_KEY, JSON.stringify(filteredSubscribers));
      return true;
    }
    return false;
  }
  throw new Error('No subscriber storage configured');
}
