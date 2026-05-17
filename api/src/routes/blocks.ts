import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import pool from '../db/client';

const router = Router();

const blockSchema = z.object({
  blocked_token: z.string().trim().min(8).max(128),
});

// POST /blocks — block a user by token
router.post('/', async (req: Request, res: Response) => {
  const userToken = req.headers['x-user-token'] as string;
  if (!userToken) return res.status(401).json({ error: 'x-user-token required' });

  const parsed = blockSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.issues });
  }
  if (parsed.data.blocked_token === userToken) {
    return res.status(400).json({ error: 'Cannot block yourself' });
  }

  try {
    await pool.query(
      `INSERT INTO user_blocks (blocker_token, blocked_token)
       VALUES ($1, $2)
       ON CONFLICT (blocker_token, blocked_token) DO NOTHING`,
      [userToken, parsed.data.blocked_token],
    );
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('POST /blocks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /blocks/:token — unblock
router.delete('/:token', async (req: Request, res: Response) => {
  const userToken = req.headers['x-user-token'] as string;
  if (!userToken) return res.status(401).json({ error: 'x-user-token required' });

  try {
    await pool.query(
      'DELETE FROM user_blocks WHERE blocker_token = $1 AND blocked_token = $2',
      [userToken, req.params.token],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /blocks/:token error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /blocks — list current blocks
router.get('/', async (req: Request, res: Response) => {
  const userToken = req.headers['x-user-token'] as string;
  if (!userToken) return res.status(401).json({ error: 'x-user-token required' });

  try {
    const result = await pool.query(
      'SELECT blocked_token, created_at FROM user_blocks WHERE blocker_token = $1 ORDER BY created_at DESC',
      [userToken],
    );
    res.json({ blocks: result.rows });
  } catch (err) {
    console.error('GET /blocks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
