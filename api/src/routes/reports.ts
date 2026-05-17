import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import pool from '../db/client';

const router = Router();

const reportSchema = z.object({
  reason: z.enum(['spam', 'offensive', 'harassment', 'inappropriate', 'other']),
  details: z.string().trim().max(500).optional(),
});

// POST /drops/:id/report
router.post('/drops/:id/report', async (req: Request, res: Response) => {
  const userToken = req.headers['x-user-token'] as string;
  if (!userToken) return res.status(401).json({ error: 'x-user-token required' });

  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.issues });
  }

  try {
    const dropCheck = await pool.query('SELECT id, user_token FROM drops WHERE id = $1', [req.params.id]);
    if (dropCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Drop not found' });
    }
    if (dropCheck.rows[0].user_token === userToken) {
      return res.status(400).json({ error: 'Cannot report your own drop' });
    }

    try {
      await pool.query(
        `INSERT INTO drop_reports (reporter_token, drop_id, reason, details)
         VALUES ($1, $2, $3, $4)`,
        [userToken, req.params.id, parsed.data.reason, parsed.data.details || null],
      );
    } catch (err: any) {
      if (err?.code === '23505') {
        return res.status(409).json({ error: 'Already reported' });
      }
      throw err;
    }

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('POST /drops/:id/report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
