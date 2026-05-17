import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import {
  getNearbyDrops, createDrop, pickupDrop, getDrop,
  addReaction, getMyPickups, getUserStats, seedDrops,
  addNote, getNotes,
} from './db/store';
import { searchVerses, listTranslations } from './bibles';
import { moderateText } from './moderation';
import { captureError, initObservability, logRequest } from './observability';

import dropsRouter from './routes/drops';
import usersRouter from './routes/users';
import pickupsRouter from './routes/pickups';
import notesRouter from './routes/notes';
import reportsRouter from './routes/reports';
import blocksRouter from './routes/blocks';
import versesRouter from './routes/verses';
import notificationsRouter from './routes/notifications';

initObservability();

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const USE_DB = !!process.env.DATABASE_URL;

// ---- Security headers ----
app.use(helmet({ contentSecurityPolicy: false }));

// ---- CORS ----
const allowedOrigins = (process.env.CORS_ORIGINS || '*')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.includes('*')
      ? true
      : (origin, cb) => {
          if (!origin) return cb(null, true);
          cb(null, allowedOrigins.includes(origin));
        },
    credentials: false,
  })
);

// ---- Body parsing ----
app.use(express.json({ limit: '32kb' }));

// ---- Request logging ----
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    logRequest(req.method, req.originalUrl, res.statusCode, Date.now() - start);
  });
  next();
});

// ---- Rate limits ----
const generalLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
const writeLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use(generalLimiter);

// ---- Health ----
app.get('/health', async (_req: Request, res: Response) => {
  if (USE_DB) {
    try {
      const { default: pool } = await import('./db/client');
      await pool.query('SELECT 1');
      return res.json({ status: 'ok', mode: 'postgres' });
    } catch (err) {
      captureError(err, { route: '/health' });
      return res.status(503).json({ status: 'degraded', mode: 'postgres', error: 'db unreachable' });
    }
  }
  res.json({ status: 'ok', mode: 'in-memory' });
});

// ---- Routes ----
if (USE_DB) {
  app.use('/drops', writeLimiter, dropsRouter);
  app.use('/drops', writeLimiter, notesRouter);   // /drops/:id/note(s)
  app.use(writeLimiter, reportsRouter);            // /drops/:id/report
  app.use('/blocks', writeLimiter, blocksRouter);
  app.use('/users', usersRouter);
  app.use('/users/me', writeLimiter, notificationsRouter);
  app.use('/pickups', pickupsRouter);
  app.use('/verses', versesRouter);
  console.log('  Mode: PostgreSQL (DATABASE_URL set)');
} else {
  // In-memory fallback for local dev with no DB.
  console.log('  Mode: in-memory (no DATABASE_URL set)');
  mountInMemoryRoutes(app);
}

// ---- 404 ----
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found', path: req.originalUrl });
});

// ---- Error handler ----
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  captureError(err, { route: req.originalUrl, method: req.method });
  res.status(500).json({ error: 'Internal server error' });
});

// ---- Boot ----
const server = app.listen(PORT, () => {
  console.log(`\n  VerseDrop API running at http://localhost:${PORT}\n`);
});

// ---- Graceful shutdown ----
const shutdown = (signal: string) => {
  console.log(`\n  ${signal} received, shutting down...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// =====================================================================
// In-memory route handlers (for local dev when no DATABASE_URL set).
// =====================================================================
function mountInMemoryRoutes(a: express.Express) {
  const requireToken = (req: Request, res: Response, next: NextFunction) => {
    if (!req.headers['x-user-token']) {
      return res.status(401).json({ error: 'x-user-token required' });
    }
    next();
  };

  a.get('/drops/nearby', requireToken, (req: Request, res: Response) => {
    const userToken = req.headers['x-user-token'] as string;
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseInt(req.query.radius_meters as string, 10) || 500;
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ error: 'Invalid lat/lng' });
    }
    seedDrops(lat, lng);
    res.json({ drops: getNearbyDrops(lat, lng, radius, userToken) });
  });

  a.post('/drops', writeLimiter, requireToken, (req: Request, res: Response) => {
    const userToken = req.headers['x-user-token'] as string;
    const { verse_reference, verse_text, verse_translation, custom_message, latitude, longitude } = req.body ?? {};
    if (!verse_reference || !verse_text || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (custom_message) {
      const verdict = moderateText(custom_message);
      if (verdict.decision === 'rejected') {
        return res.status(422).json({ error: 'Custom message rejected', reason: verdict.reason });
      }
    }
    const drop = createDrop({
      user_token: userToken, verse_reference, verse_text,
      verse_translation: verse_translation || 'KJV',
      custom_message, latitude, longitude,
    });
    res.status(201).json({
      drop: { ...drop, is_picked_up: false, reactions: { amen: 0, heart: 0, pray: 0, user_reaction: null } },
      status: 'live',
    });
  });

  a.get('/drops/my-pickups', requireToken, (req: Request, res: Response) => {
    res.json(getMyPickups(req.headers['x-user-token'] as string));
  });

  a.post('/drops/:id/pickup', writeLimiter, requireToken, (req: Request, res: Response) => {
    const userToken = req.headers['x-user-token'] as string;
    const result = pickupDrop(req.params.id, userToken);
    if (result.alreadyPickedUp) return res.status(409).json({ error: 'Already picked up' });
    if (!result.success) return res.status(404).json({ error: 'Drop not found' });
    res.json({ drop: getDrop(req.params.id, userToken) });
  });

  a.post('/drops/:id/react', writeLimiter, requireToken, (req: Request, res: Response) => {
    const userToken = req.headers['x-user-token'] as string;
    const { reaction_type } = req.body ?? {};
    if (!['amen', 'heart', 'pray'].includes(reaction_type)) {
      return res.status(400).json({ error: 'Invalid reaction_type' });
    }
    res.json({ reactions: addReaction(req.params.id, userToken, reaction_type) });
  });

  a.post('/drops/:id/note', writeLimiter, requireToken, (req: Request, res: Response) => {
    const userToken = req.headers['x-user-token'] as string;
    const { text } = req.body ?? {};
    if (!text || typeof text !== 'string' || text.length > 500) {
      return res.status(400).json({ error: 'Note text required (max 500 chars)' });
    }
    const verdict = moderateText(text);
    if (verdict.decision === 'rejected') {
      return res.status(422).json({ error: 'Note rejected', reason: verdict.reason });
    }
    res.status(201).json({ note: addNote(req.params.id, userToken, text.trim()) });
  });

  a.get('/drops/:id/notes', (req: Request, res: Response) => {
    res.json({ notes: getNotes(req.params.id) });
  });

  // In-memory mode: accept reports/blocks as no-ops so the mobile UI can be tested.
  a.post('/drops/:id/report', writeLimiter, requireToken, (_req: Request, res: Response) => {
    res.status(201).json({ ok: true, note: 'in-memory mode: report recorded but not persisted' });
  });
  a.post('/blocks', writeLimiter, requireToken, (_req: Request, res: Response) => {
    res.status(201).json({ ok: true, note: 'in-memory mode: block recorded but not persisted' });
  });
  a.delete('/blocks/:token', requireToken, (_req: Request, res: Response) => res.json({ ok: true }));
  a.get('/blocks', requireToken, (_req: Request, res: Response) => res.json({ blocks: [] }));

  a.get('/users/me', requireToken, (req: Request, res: Response) => {
    res.json(getUserStats(req.headers['x-user-token'] as string));
  });

  a.get('/verses/search', (req: Request, res: Response) => {
    const q = (req.query.q as string) || '';
    const translation = (req.query.translation as string) || undefined;
    res.json({ verses: searchVerses(q, translation), translation: translation ?? null });
  });

  a.get('/verses/translations', (_req: Request, res: Response) => {
    res.json({ translations: listTranslations() });
  });
}
