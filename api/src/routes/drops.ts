import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import pool from '../db/client';
import { moderateText } from '../moderation';
import { notifyDropPickedUp } from '../notify';
import { isKnownTranslation, getDefaultTranslation } from '../bibles';
import notesRouter from './notes';

const router = Router();

// Mount notes under /drops/:id/note(s)
router.use('/', notesRouter);

// Validation schemas
const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius_meters: z.coerce.number().int().min(1).max(5000).default(300),
});

const createDropSchema = z.object({
  verse_reference: z.string().min(1).max(50),
  verse_text: z.string().min(1).max(500),
  verse_translation: z.string().min(1).max(16).optional(),
  custom_message: z.string().max(280).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const reactSchema = z.object({
  reaction_type: z.enum(['amen', 'heart', 'pray']),
});

// GET /drops/nearby
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const userToken = req.headers['x-user-token'] as string;
    if (!userToken) {
      return res.status(401).json({ error: 'x-user-token header required' });
    }

    const parsed = nearbyQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid query params', details: parsed.error.issues });
    }

    const { lat, lng, radius_meters } = parsed.data;

    // Get nearby drops with distance and pickup status.
    // Filters out drops authored by users the requester has blocked.
    const dropsResult = await pool.query(
      `SELECT
        d.id, d.user_token, d.verse_reference, d.verse_text, d.verse_translation, d.custom_message,
        d.pickup_count, d.created_at, d.moderation_status,
        ST_Distance(d.location, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance_meters,
        EXISTS(
          SELECT 1 FROM user_pickups up
          WHERE up.drop_id = d.id AND up.user_token = $3
        ) as is_picked_up,
        ST_Y(d.location::geometry) as latitude,
        ST_X(d.location::geometry) as longitude
      FROM drops d
      WHERE ST_DWithin(
        d.location,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $4
      )
      AND d.moderation_status = 'approved'
      AND NOT EXISTS (
        SELECT 1 FROM user_blocks ub
        WHERE ub.blocker_token = $3 AND ub.blocked_token = d.user_token
      )
      ORDER BY distance_meters ASC
      LIMIT 50`,
      [lng, lat, userToken, radius_meters]
    );

    // Get reactions for all returned drops
    const dropIds = dropsResult.rows.map((d: any) => d.id);
    let reactionsMap: Record<string, any> = {};

    if (dropIds.length > 0) {
      const reactionsResult = await pool.query(
        `SELECT
          drop_id,
          reaction_type,
          COUNT(*)::int as count
        FROM drop_reactions
        WHERE drop_id = ANY($1)
        GROUP BY drop_id, reaction_type`,
        [dropIds]
      );

      // Also get user's own reactions
      const userReactionsResult = await pool.query(
        `SELECT drop_id, reaction_type
        FROM drop_reactions
        WHERE drop_id = ANY($1) AND user_token = $2`,
        [dropIds, userToken]
      );

      const userReactions: Record<string, string> = {};
      for (const row of userReactionsResult.rows) {
        userReactions[row.drop_id] = row.reaction_type;
      }

      for (const row of reactionsResult.rows) {
        if (!reactionsMap[row.drop_id]) {
          reactionsMap[row.drop_id] = { amen: 0, heart: 0, pray: 0 };
        }
        reactionsMap[row.drop_id][row.reaction_type] = row.count;
      }

      // Add user_reaction
      for (const dropId of dropIds) {
        if (!reactionsMap[dropId]) {
          reactionsMap[dropId] = { amen: 0, heart: 0, pray: 0 };
        }
        reactionsMap[dropId].user_reaction = userReactions[dropId] || null;
      }
    }

    const drops = dropsResult.rows.map((d: any) => ({
      id: d.id,
      user_token: d.user_token,
      verse_reference: d.verse_reference,
      verse_text: d.verse_text,
      verse_translation: d.verse_translation,
      custom_message: d.custom_message,
      latitude: d.latitude,
      longitude: d.longitude,
      distance_meters: parseFloat(d.distance_meters),
      pickup_count: d.pickup_count,
      is_picked_up: d.is_picked_up,
      reactions: reactionsMap[d.id] || { amen: 0, heart: 0, pray: 0, user_reaction: null },
      created_at: d.created_at,
    }));

    res.json({ drops });
  } catch (err) {
    console.error('GET /drops/nearby error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /drops/my-pickups
router.get('/my-pickups', async (req: Request, res: Response) => {
  try {
    const userToken = req.headers['x-user-token'] as string;
    if (!userToken) {
      return res.status(401).json({ error: 'x-user-token header required' });
    }

    const result = await pool.query(
      `SELECT
        d.id, d.user_token, d.verse_reference, d.verse_text, d.verse_translation, d.custom_message,
        d.pickup_count, d.created_at,
        ST_Y(d.location::geometry) as latitude,
        ST_X(d.location::geometry) as longitude,
        up.picked_up_at
      FROM user_pickups up
      JOIN drops d ON d.id = up.drop_id
      WHERE up.user_token = $1
      ORDER BY up.picked_up_at DESC`,
      [userToken]
    );

    const drops = result.rows.map((d: any) => ({
      id: d.id,
      user_token: d.user_token,
      verse_reference: d.verse_reference,
      verse_text: d.verse_text,
      verse_translation: d.verse_translation,
      custom_message: d.custom_message,
      latitude: d.latitude,
      longitude: d.longitude,
      pickup_count: d.pickup_count,
      is_picked_up: true,
      reactions: { amen: 0, heart: 0, pray: 0, user_reaction: null },
      created_at: d.created_at,
      picked_up_at: d.picked_up_at,
    }));

    // Calculate streak
    const streakResult = await pool.query(
      `SELECT DISTINCT DATE(picked_up_at AT TIME ZONE 'UTC') as pickup_date
      FROM user_pickups
      WHERE user_token = $1
      ORDER BY pickup_date DESC`,
      [userToken]
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < streakResult.rows.length; i++) {
      const pickupDate = new Date(streakResult.rows[i].pickup_date);
      pickupDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (pickupDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    res.json({ drops, streak, total: drops.length });
  } catch (err) {
    console.error('GET /drops/my-pickups error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /drops
router.post('/', async (req: Request, res: Response) => {
  try {
    const userToken = req.headers['x-user-token'] as string;
    if (!userToken) {
      return res.status(401).json({ error: 'x-user-token header required' });
    }

    const parsed = createDropSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid body', details: parsed.error.issues });
    }

    const { verse_reference, verse_text, custom_message, latitude, longitude } = parsed.data;

    // Resolve translation: must be known, otherwise default.
    const verse_translation =
      parsed.data.verse_translation && isKnownTranslation(parsed.data.verse_translation)
        ? parsed.data.verse_translation
        : getDefaultTranslation();

    // Moderate custom_message before persisting.
    let moderationStatus: 'approved' | 'pending' | 'rejected' = 'approved';
    if (custom_message) {
      const verdict = moderateText(custom_message);
      if (verdict.decision === 'rejected') {
        return res.status(422).json({
          error: 'Custom message rejected by content policy',
          reason: verdict.reason,
        });
      }
      if (verdict.decision === 'pending') moderationStatus = 'pending';
    }

    const result = await pool.query(
      `INSERT INTO drops (user_token, verse_reference, verse_text, verse_translation, custom_message, location, moderation_status)
      VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326), $8)
      RETURNING
        id, user_token, verse_reference, verse_text, verse_translation, custom_message,
        pickup_count, created_at, moderation_status,
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude`,
      [userToken, verse_reference, verse_text, verse_translation, custom_message || null, longitude, latitude, moderationStatus]
    );

    const d = result.rows[0];
    const drop = {
      id: d.id,
      user_token: d.user_token,
      verse_reference: d.verse_reference,
      verse_text: d.verse_text,
      verse_translation: d.verse_translation,
      custom_message: d.custom_message,
      latitude: d.latitude,
      longitude: d.longitude,
      pickup_count: d.pickup_count,
      is_picked_up: false,
      reactions: { amen: 0, heart: 0, pray: 0, user_reaction: null },
      created_at: d.created_at,
    };

    res.status(201).json({
      drop,
      status: moderationStatus === 'approved' ? 'live' : 'pending_moderation',
    });
  } catch (err) {
    console.error('POST /drops error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /drops/:id/pickup
router.post('/:id/pickup', async (req: Request, res: Response) => {
  try {
    const userToken = req.headers['x-user-token'] as string;
    if (!userToken) {
      return res.status(401).json({ error: 'x-user-token header required' });
    }

    const { id } = req.params;

    // Check drop exists
    const dropCheck = await pool.query('SELECT id FROM drops WHERE id = $1', [id]);
    if (dropCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Drop not found' });
    }

    // Try to insert pickup (UNIQUE constraint handles duplicates)
    try {
      await pool.query(
        'INSERT INTO user_pickups (user_token, drop_id) VALUES ($1, $2)',
        [userToken, id]
      );

      // Increment pickup count
      await pool.query(
        'UPDATE drops SET pickup_count = pickup_count + 1 WHERE id = $1',
        [id]
      );
    } catch (err: any) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Already picked up' });
      }
      throw err;
    }

    // Return updated drop
    const result = await pool.query(
      `SELECT
        d.id, d.user_token, d.verse_reference, d.verse_text, d.verse_translation, d.custom_message,
        d.pickup_count, d.created_at,
        ST_Y(d.location::geometry) as latitude,
        ST_X(d.location::geometry) as longitude
      FROM drops d
      WHERE d.id = $1`,
      [id]
    );

    const d = result.rows[0];

    // Fire-and-forget pickup notification to the drop's author.
    // Skip when the picker IS the author (you picked up your own drop).
    if (d.user_token && d.user_token !== userToken) {
      void notifyDropPickedUp({
        dropOwnerToken: d.user_token,
        verseReference: d.verse_reference,
        newPickupCount: d.pickup_count,
      });
    }

    res.json({
      drop: {
        id: d.id,
        user_token: d.user_token,
        verse_reference: d.verse_reference,
        verse_text: d.verse_text,
        verse_translation: d.verse_translation,
        custom_message: d.custom_message,
        latitude: d.latitude,
        longitude: d.longitude,
        pickup_count: d.pickup_count,
        is_picked_up: true,
        reactions: { amen: 0, heart: 0, pray: 0, user_reaction: null },
        created_at: d.created_at,
      },
    });
  } catch (err) {
    console.error('POST /drops/:id/pickup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /drops/:id/react
router.post('/:id/react', async (req: Request, res: Response) => {
  try {
    const userToken = req.headers['x-user-token'] as string;
    if (!userToken) {
      return res.status(401).json({ error: 'x-user-token header required' });
    }

    const { id } = req.params;
    const parsed = reactSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid body', details: parsed.error.issues });
    }

    const { reaction_type } = parsed.data;

    // Upsert reaction
    await pool.query(
      `INSERT INTO drop_reactions (user_token, drop_id, reaction_type)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_token, drop_id, reaction_type) DO NOTHING`,
      [userToken, id, reaction_type]
    );

    // Get updated counts
    const result = await pool.query(
      `SELECT reaction_type, COUNT(*)::int as count
      FROM drop_reactions
      WHERE drop_id = $1
      GROUP BY reaction_type`,
      [id]
    );

    const reactions: Record<string, number> = { amen: 0, heart: 0, pray: 0 };
    for (const row of result.rows) {
      reactions[row.reaction_type] = row.count;
    }

    res.json({ reactions: { ...reactions, user_reaction: reaction_type } });
  } catch (err) {
    console.error('POST /drops/:id/react error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
