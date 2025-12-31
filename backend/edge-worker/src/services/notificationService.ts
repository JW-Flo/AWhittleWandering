import { logger } from '../utils/log';
import { makeVapidAuthorization } from '../utils/vapid';

export type JourneyNotificationType =
  | 'journey_waypoint'
  | 'journey_state_crossing'
  | 'journey_photo'
  | 'journey_charging'
  | 'security_alert';

export async function createInboxNotification(env: any, input: {
  userId: string;
  journeyId?: string | null;
  notificationType: JourneyNotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const db = env?.TESLA_DB;
  if (!db) throw new Error('Database not configured');
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO notifications (id, user_id, journey_id, notification_type, title, body, metadata_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .bind(
      id,
      input.userId,
      input.journeyId || null,
      input.notificationType,
      input.title,
      input.body,
      input.metadata ? JSON.stringify(input.metadata) : null
    )
    .run();
}

async function deliverWebPush(env: any, subscription: any): Promise<{ ok: boolean; status: number }> {
  const pub = String(env?.VAPID_PUBLIC_KEY || '').trim();
  const priv = String(env?.VAPID_PRIVATE_KEY || '').trim();
  const subject = String(env?.PUSH_SUBJECT || 'mailto:support@awhittlewandering.com').trim();
  if (!pub || !priv) return { ok: false, status: 500 };

  const { authorization, cryptoKey } = await makeVapidAuthorization(subscription.endpoint, subject, pub, priv);
  const res = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      TTL: '300',
      Authorization: authorization,
      'Crypto-Key': cryptoKey,
    },
    body: null, // no payload (avoids RFC8291 encryption)
  });
  return { ok: res.ok, status: res.status };
}

export async function fanoutJourneyNotification(env: any, input: {
  journeyId: string;
  notificationType: JourneyNotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}): Promise<{ recipients: number; pushesAttempted: number; pushesOk: number }> {
  const db = env?.TESLA_DB;
  if (!db) throw new Error('Database not configured');

  // Resolve recipients based on follow + per-type prefs
  const prefsCol =
    input.notificationType === 'journey_waypoint'
      ? 'notify_waypoints'
      : input.notificationType === 'journey_state_crossing'
        ? 'notify_state_crossings'
        : input.notificationType === 'journey_photo'
          ? 'notify_photos'
          : input.notificationType === 'journey_charging'
            ? 'notify_charging'
            : 'notify_security';

  const recipients = await db
    .prepare(
      `SELECT jf.user_id as user_id
       FROM journey_follows jf
       JOIN journey_follow_notification_prefs jp
         ON jp.journey_id = jf.journey_id AND jp.user_id = jf.user_id
       WHERE jf.journey_id = ?
         AND jf.unfollowed_at IS NULL
         AND COALESCE(jp.${prefsCol}, 0) = 1`
    )
    .bind(input.journeyId)
    .all<any>();

  const userIds = (recipients.results || []).map((r: any) => String(r.user_id)).filter(Boolean);
  let pushesAttempted = 0;
  let pushesOk = 0;

  for (const userId of userIds) {
    await createInboxNotification(env, {
      userId,
      journeyId: input.journeyId,
      notificationType: input.notificationType,
      title: input.title,
      body: input.body,
      metadata: input.metadata,
    });

    const subs = await db
      .prepare(
        `SELECT id, endpoint, p256dh, auth
         FROM push_subscriptions
         WHERE user_id = ? AND revoked_at IS NULL`
      )
      .bind(userId)
      .all<any>();

    for (const sub of subs.results || []) {
      pushesAttempted++;
      try {
        const delivered = await deliverWebPush(env, sub);
        if (delivered.ok) {
          pushesOk++;
          await db
            .prepare(`UPDATE push_subscriptions SET last_seen_at = datetime('now') WHERE id = ?`)
            .bind(sub.id)
            .run();
        } else if (delivered.status === 404 || delivered.status === 410) {
          await db
            .prepare(`UPDATE push_subscriptions SET revoked_at = datetime('now') WHERE id = ?`)
            .bind(sub.id)
            .run();
        }
      } catch (err: any) {
        logger.warn('push_delivery_failed', { userId, journeyId: input.journeyId, err: String(err?.message || err) });
      }
    }
  }

  return { recipients: userIds.length, pushesAttempted, pushesOk };
}










