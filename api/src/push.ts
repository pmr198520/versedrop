// Expo Push wrapper. No-op (logs to console) in dev / when push tokens aren't registered.

import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk';

const accessToken = process.env.EXPO_ACCESS_TOKEN; // optional but recommended in prod
const expo = new Expo(accessToken ? { accessToken } : undefined);

export interface SendPushParams {
  to: string;                  // ExponentPushToken[xxx]
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channelId?: string;          // Android only — see expo-notifications setChannel
}

export async function sendPush(params: SendPushParams): Promise<{ sent: boolean; ticket?: ExpoPushTicket; reason?: string }> {
  if (!Expo.isExpoPushToken(params.to)) {
    return { sent: false, reason: 'invalid_token' };
  }

  const message: ExpoPushMessage = {
    to: params.to,
    sound: 'default',
    title: params.title,
    body: params.body,
    data: params.data,
    channelId: params.channelId || 'default',
    priority: 'high',
  };

  try {
    const tickets = await expo.sendPushNotificationsAsync([message]);
    const ticket = tickets[0];
    if (ticket.status === 'error') {
      console.error('[push] ticket error', ticket);
      return { sent: false, ticket, reason: ticket.message };
    }
    return { sent: true, ticket };
  } catch (err: any) {
    console.error('[push] send failed', { to: params.to, error: err?.message });
    return { sent: false, reason: err?.message || 'send_error' };
  }
}

// Batch helper for fan-out notifications.
export async function sendPushBatch(messages: SendPushParams[]): Promise<ExpoPushTicket[]> {
  const valid = messages.filter((m) => Expo.isExpoPushToken(m.to));
  const chunks = expo.chunkPushNotifications(
    valid.map((m) => ({
      to: m.to,
      sound: 'default' as const,
      title: m.title,
      body: m.body,
      data: m.data,
      channelId: m.channelId || 'default',
      priority: 'high' as const,
    }))
  );
  const tickets: ExpoPushTicket[] = [];
  for (const chunk of chunks) {
    try {
      const result = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...result);
    } catch (err) {
      console.error('[push] batch failed', err);
    }
  }
  return tickets;
}
