// Postmark transactional email wrapper.
// No-op (logs to console) if POSTMARK_SERVER_TOKEN is not set, so dev keeps working.

import { ServerClient } from 'postmark';

const token = process.env.POSTMARK_SERVER_TOKEN;
const fromEmail = process.env.POSTMARK_FROM_EMAIL || 'noreply@versedrop.app';
const replyToEmail = process.env.POSTMARK_REPLY_TO || 'support@versedrop.app';
const messageStreamId = process.env.POSTMARK_MESSAGE_STREAM || 'outbound';

const client = token ? new ServerClient(token) : null;

if (!client && process.env.NODE_ENV === 'production') {
  console.warn('[email] POSTMARK_SERVER_TOKEN not set — email sending is disabled');
}

export type EmailKind =
  | 'verify_email'
  | 'pickup_notification'
  | 'reaction_notification'
  | 'weekly_digest';

export interface SendEmailParams {
  to: string;
  kind: EmailKind;
  subject: string;
  html: string;
  text: string;
  tag?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{ sent: boolean; reason?: string }> {
  if (!client) {
    console.log(`[email:dry-run] to=${params.to} kind=${params.kind} subject="${params.subject}"`);
    return { sent: false, reason: 'no_postmark_token' };
  }

  try {
    await client.sendEmail({
      From: fromEmail,
      To: params.to,
      Subject: params.subject,
      HtmlBody: params.html,
      TextBody: params.text,
      ReplyTo: replyToEmail,
      MessageStream: messageStreamId,
      Tag: params.tag || params.kind,
      TrackOpens: false,
      // Link tracking is controlled at the server level in Postmark's dashboard.
    });
    return { sent: true };
  } catch (err: any) {
    console.error('[email] send failed', { kind: params.kind, to: params.to, error: err?.message });
    return { sent: false, reason: err?.code || 'send_error' };
  }
}

// ---------- Templates ----------

export function verifyEmailTemplate(verifyUrl: string) {
  return {
    subject: 'Confirm your email for VerseDrop',
    text:
      `Confirm your email for VerseDrop by opening this link:\n\n${verifyUrl}\n\n` +
      `The link expires in 24 hours. If you didn't request this, you can ignore this email.\n`,
    html:
      `<p>Confirm your email for VerseDrop by clicking the button below.</p>` +
      `<p><a href="${verifyUrl}" style="display:inline-block;background:#D4A245;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Confirm email</a></p>` +
      `<p style="color:#6a6a7a;font-size:12px">Or paste this link: ${verifyUrl}</p>` +
      `<p style="color:#6a6a7a;font-size:12px">The link expires in 24 hours. If you didn't request this, you can ignore this email.</p>`,
  };
}

export function pickupNotificationTemplate(verseReference: string, pickupCount: number) {
  return {
    subject: `Someone picked up ${verseReference}`,
    text:
      `Someone just picked up your drop of ${verseReference}.\n` +
      `Total pickups so far: ${pickupCount}.\n\n` +
      `— VerseDrop`,
    html:
      `<p>Someone just picked up your drop of <strong>${verseReference}</strong>.</p>` +
      `<p>Total pickups so far: <strong>${pickupCount}</strong>.</p>` +
      `<p style="color:#6a6a7a;font-size:12px">— VerseDrop</p>`,
  };
}
