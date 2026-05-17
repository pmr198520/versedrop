import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';
import type { Drop, VerseResult, Note, UserStats, BibleTranslation } from '../types';

// Resolved at build time from app.config.ts → extra.apiUrl, which reads
// EXPO_PUBLIC_API_URL at config time. See .env.example for setup.
const BASE_URL: string =
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ||
  'http://10.0.2.2:3001';

const REQUEST_TIMEOUT_MS = 15000;

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().userToken;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-user-token': token } : {}),
        ...options.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw { status: res.status, ...err };
    }
    return res.json();
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw { status: 0, error: 'Request timed out' };
    }
    if (err?.status !== undefined) throw err;
    throw { status: 0, error: 'Network error' };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchNearbyDrops(lat: number, lng: number, radius = 500): Promise<Drop[]> {
  const data = await request<{ drops: Drop[] }>(`/drops/nearby?lat=${lat}&lng=${lng}&radius_meters=${radius}`);
  return data.drops;
}

export async function createDrop(body: {
  verse_reference: string;
  verse_text: string;
  verse_translation?: string;
  custom_message?: string;
  latitude: number;
  longitude: number;
}) {
  return request('/drops', { method: 'POST', body: JSON.stringify(body) });
}

export async function pickupDrop(dropId: string) {
  return request(`/drops/${dropId}/pickup`, { method: 'POST' });
}

export async function reactToDrop(dropId: string, reactionType: string) {
  return request(`/drops/${dropId}/react`, {
    method: 'POST',
    body: JSON.stringify({ reaction_type: reactionType }),
  });
}

export async function fetchMyPickups() {
  return request<{ drops: Drop[]; streak: number; total: number }>('/drops/my-pickups');
}

export async function fetchUserProfile(): Promise<UserStats> {
  return request<UserStats>('/users/me');
}

export async function searchVerses(query: string, translation?: string): Promise<VerseResult[]> {
  const params = new URLSearchParams({ q: query });
  if (translation) params.set('translation', translation);
  const data = await request<{ verses: VerseResult[] }>(`/verses/search?${params.toString()}`);
  return data.verses;
}

export async function listBibleTranslations(): Promise<BibleTranslation[]> {
  const data = await request<{ translations: BibleTranslation[] }>('/verses/translations');
  return data.translations;
}

export async function addNoteToDrop(dropId: string, text: string) {
  return request(`/drops/${dropId}/note`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function fetchDropNotes(dropId: string): Promise<Note[]> {
  const data = await request<{ notes: Note[] }>(`/drops/${dropId}/notes`);
  return data.notes;
}

export type ReportReason = 'spam' | 'offensive' | 'harassment' | 'inappropriate' | 'other';

export async function reportDrop(dropId: string, reason: ReportReason, details?: string) {
  return request(`/drops/${dropId}/report`, {
    method: 'POST',
    body: JSON.stringify({ reason, details }),
  });
}

export async function blockUser(blockedToken: string) {
  return request('/blocks', {
    method: 'POST',
    body: JSON.stringify({ blocked_token: blockedToken }),
  });
}

export async function unblockUser(blockedToken: string) {
  return request(`/blocks/${blockedToken}`, { method: 'DELETE' });
}

export async function listBlocks(): Promise<{ blocked_token: string; created_at: string }[]> {
  const data = await request<{ blocks: { blocked_token: string; created_at: string }[] }>('/blocks');
  return data.blocks;
}

// ---------- Notifications ----------

export interface NotificationPrefs {
  email: string | null;
  email_verified: boolean;
  push_enabled: boolean;
  preferred_translation: string;
  notify_on_pickup: boolean;
  notify_on_reaction: boolean;
  notify_on_nearby_drop: boolean;
  notify_weekly_digest: boolean;
}

export async function registerPushToken(pushToken: string, platform: 'ios' | 'android' | 'web') {
  return request('/users/me/push-token', {
    method: 'POST',
    body: JSON.stringify({ push_token: pushToken, push_platform: platform }),
  });
}

export async function clearPushToken() {
  return request('/users/me/push-token', { method: 'DELETE' });
}

export async function setEmail(email: string) {
  return request<{ ok: boolean; pending_verification: boolean }>('/users/me/email', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  return request<NotificationPrefs>('/users/me/notifications');
}

export async function updateNotificationPrefs(prefs: Partial<NotificationPrefs>) {
  return request('/users/me/notifications', {
    method: 'PATCH',
    body: JSON.stringify(prefs),
  });
}
