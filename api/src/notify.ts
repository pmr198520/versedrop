// Outbound notification orchestrator.
// Decides per user-preference whether to send a push, an email, both, or neither.
// All errors are swallowed and logged — notifications must never break the request.

import pool from './db/client';
import { sendPush } from './push';
import { sendEmail, pickupNotificationTemplate } from './email';

export async function notifyDropPickedUp(params: {
  dropOwnerToken: string;
  verseReference: string;
  newPickupCount: number;
}) {
  try {
    const result = await pool.query(
      `SELECT email, email_verified_at IS NOT NULL AS email_verified,
              push_token, notify_on_pickup
       FROM users WHERE user_token = $1`,
      [params.dropOwnerToken]
    );
    if (result.rows.length === 0) return;

    const u = result.rows[0];
    if (!u.notify_on_pickup) return;

    if (u.push_token) {
      void sendPush({
        to: u.push_token,
        title: `Someone picked up ${params.verseReference}`,
        body: `Total pickups: ${params.newPickupCount}`,
        data: { type: 'pickup', verse_reference: params.verseReference },
      });
    }

    if (u.email && u.email_verified) {
      const tpl = pickupNotificationTemplate(params.verseReference, params.newPickupCount);
      void sendEmail({ to: u.email, kind: 'pickup_notification', ...tpl });
    }
  } catch (err) {
    console.error('[notify] dropPickedUp failed', err);
  }
}
