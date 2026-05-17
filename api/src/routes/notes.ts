import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import pool from '../db/client';
import { moderateText } from '../moderation';

const router = Router({ mergeParams: true });

const addNoteSchema = z.object({
  text: z.string().trim().min(1).max(500),
});

// POST /drops/:id/note
router.post('/:id/note', async (req: Request, res: Response) => {
  const userToken = req.headers['x-user-token'] as string;
  if (!userToken) return res.status(401).json({ error: 'x-user-token required' });

  const parsed = addNoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.issues });
  }

  const verdict = moderateText(parsed.data.text);
  if (verdict.decision === 'rejected') {
    return res.status(422).json({ error: 'Note rejected by content policy', reason: verdict.reason });
  }

  try {
    const dropCheck = await pool.query('SELECT id FROM drops WHERE id = $1', [req.params.id]);
    if (dropCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Drop not found' });
    }

    const result = await pool.query(
      `INSERT INTO drop_notes (user_token, drop_id, text, moderation_status)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_token, drop_id, text, created_at, moderation_status`,
      [
        userToken,
        req.params.id,
        parsed.data.text,
        verdict.decision === 'pending' ? 'pending' : 'approved',
      ],
    );

    res.status(201).json({ note: result.rows[0] });
  } catch (err) {
    console.error('POST /drops/:id/note error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /drops/:id/notes — only approved notes are returned to clients
router.get('/:id/notes', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, user_token, drop_id, text, created_at
       FROM drop_notes
       WHERE drop_id = $1 AND moderation_status = 'approved'
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.params.id],
    );
    res.json({ notes: result.rows });
  } catch (err) {
    console.error('GET /drops/:id/notes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
