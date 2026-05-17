import { Router, type Request, type Response } from 'express';
import { searchVerses, listTranslations } from '../bibles';

const router = Router();

// GET /verses/search?q=...&translation=KJV
router.get('/search', (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  const translation = (req.query.translation as string) || undefined;
  res.json({ verses: searchVerses(query, translation), translation: translation ?? null });
});

// GET /verses/translations — list what the app supports
router.get('/translations', (_req: Request, res: Response) => {
  res.json({ translations: listTranslations() });
});

export default router;
