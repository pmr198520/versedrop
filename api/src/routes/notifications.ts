import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import crypto from 'node:crypto';
import pool from '../db/client';
import { sendEmail, verifyEmailTemplate } from '../email';

const router = Router();

const pushTokenSchema = z.object({
  push_token: z.string().trim().min(10).max(256),
  push_platform: z.enum(['ios', 'android', 'web']),
});

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
});

const prefsSchema = z.object({
  notify_on_pickup: z.boolean().optional(),
  notify_on_reaction: z.boolean().optional(),
  notify_on_nearby_drop: z.boolean().optional(),
  notify_weekly_digest: z.boolean().optional(),
  preferred_translation: z.string().min(1).max(16).optional(),
});

// POST /users/me/push-token — register or update push token
router.post('/push-token', async (req: Request, res: Response) => {
  const userToken = req.headers['x-user-token'] as string;
  if (!userToken) return res.status(401).json({ error: 'x-user-token required' });

  const parsed = pushTokenSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body', details: parsed.error.issues });

  try {
    await pool.query(
      `INSERT INTO users (user_token, push_token, push_platform, push_updated_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (user_token)
       DO UPDATE SET push_token = EXCLUDED.push_token,
                     push_platform = EXCLUDED.push_platform,
                     push_updated_at = NOW(),
                     updated_at = NOW()`,
      [userToken, parsed.data.push_token, parsed.data.push_platform]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('POST /users/me/push-token error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /users/me/push-token — clear push token (user opted out)
router.delete('/push-token', async (req: Request, res: Response) => {
  const userToken = req.headers['x-user-token'] as string;
  if (!userToken) return res.status(401).json({ error: 'x-user-token required' });

  try {
    await pool.query(
      `UPDATE users SET push_token = NULL, push_platform = NULL, push_updated_at = NOW(), updated_at = NOW()
       WHERE user_token = $1`,
      [userToken]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /users/me/push-token error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /users/me/email — set email; sends verification email
router.post('/email', async (req: Request, res: Response) => {
  const userToken = req.headers['x-user-token'] as string;
  if (!userToken) return res.status(401).json({ error: 'x-user-token required' });

  const parsed = emailSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid email' });

  const { email } = parsed.data;

  try {
    await pool.query(
      `INSERT INTO users (user_token, email, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_token)
       DO UPDATE SET email = EXCLUDED.email, email_verified_at = NULL, updated_at = NOW()`,
      [userToken, email]
    );

    // Create verification token (raw → emailed; hash → stored)
    const rawToken = crypto.randomBytes(24).toString('base64url');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await pool.query(
      `INSERT INTO email_verifications (user_token, email, token_hash, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [userToken, email, tokenHash, expiresAt]
    );

    const verifyBase = process.env.PUBLIC_APP_URL || 'https://versedrop.app';
    const verifyUrl = `${verifyBase}/verify-email?token=${encodeURIComponent(rawToken)}`;
    const tpl = verifyEmailTemplate(verifyUrl);
    await sendEmail({ to: email, kind: 'verify_email', ...tpl, tag: 'verify' });

    res.json({ ok: true, pending_verification: true });
  } catch (err) {
    console.error('POST /users/me/email error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /users/me/email/verify — consume verification token
router.post('/email/verify', async (req: Request, res: Response) => {
  const rawToken = (req.body?.token as string) || (req.query?.token as string);
  if (!rawToken) return res.status(400).json({ error: 'token required' });

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  try {
    const result = await pool.query(
      `UPDATE email_verifications
       SET consumed_at = NOW()
       WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > NOW()
       RETURNING user_token, email`,
      [tokenHash]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired token' });
    }
    const { user_token, email } = result.rows[0];

    await pool.query(
      `UPDATE users SET email_verified_at = NOW(), updated_at = NOW()
       WHERE user_token = $1 AND email = $2`,
      [user_token, email]
    );
    res.json({ ok: true, email });
  } catch (err) {
    console.error('POST /users/me/email/verify error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /users/me/notifications — current preferences
router.get('/notifications', async (req: Request, res: Response) => {
  const userToken = req.headers['x-user-token'] as string;
  if (!userToken) return res.status(401).json({ error: 'x-user-token required' });

  try {
    const result = await pool.query(
      `SELECT email, email_verified_at IS NOT NULL AS email_verified,
              push_token IS NOT NULL AS push_enabled,
              preferred_translation,
              notify_on_pickup, notify_on_reaction,
              notify_on_nearby_drop, notify_weekly_digest
       FROM users WHERE user_token = $1`,
      [userToken]
    );
    if (result.rows.length === 0) {
      return res.json({
        email: null, email_verified: false, push_enabled: false,
        preferred_translation: 'KJV',
        notify_on_pickup: true, notify_on_reaction: true,
        notify_on_nearby_drop: false, notify_weekly_digest: false,
      });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('GET /users/me/notifications error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /users/me/notifications — update preferences
router.patch('/notifications', async (req: Request, res: Response) => {
  const userToken = req.headers['x-user-token'] as string;
  if (!userToken) return res.status(401).json({ error: 'x-user-token required' });

  const parsed = prefsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body', details: parsed.error.issues });

  const fields = parsed.data;
  if (Object.keys(fields).length === 0) return res.json({ ok: true });

  // Build dynamic UPDATE only on provided keys
  const cols = Object.keys(fields);
  const sets = cols.map((c, i) => `${c} = $${i + 2}`).join(', ');
  const values = cols.map((c) => (fields as any)[c]);

  try {
    await pool.query(
      `INSERT INTO users (user_token, ${cols.join(', ')}, updated_at)
       VALUES ($1, ${cols.map((_, i) => `$${i + 2}`).join(', ')}, NOW())
       ON CONFLICT (user_token) DO UPDATE SET ${sets}, updated_at = NOW()`,
      [userToken, ...values]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('PATCH /users/me/notifications error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
