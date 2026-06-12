import Anthropic from '@anthropic-ai/sdk';
import cors from 'cors';
import express from 'express';

import { analyzeClothingImage, RefusalError, type ImageMediaType } from './analyze.js';

const PORT = Number(process.env.PORT ?? 3000);
/** Необязательный общий секрет приложения: если задан, клиент должен слать его в x-app-token. */
const APP_TOKEN = process.env.APP_TOKEN ?? '';

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Не задан ANTHROPIC_API_KEY. Пример запуска:');
  console.error('  ANTHROPIC_API_KEY=sk-ant-... npm start');
  process.exit(1);
}

const app = express();
app.use(cors());
// Фото в base64: 10 МБ хватает на снимки с телефона при quality 0.7
app.use(express.json({ limit: '10mb' }));

/* ---------- простейший rate limit на IP (без внешних зависимостей) ---------- */
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;
const hits = new Map<string, { count: number; windowStart: number }>();

app.use('/api/', (req, res, next) => {
  const ip = req.ip ?? 'unknown';
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    hits.set(ip, { count: 1, windowStart: now });
    return next();
  }
  entry.count += 1;
  if (entry.count > MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({ error: 'Слишком много запросов, попробуйте через минуту.' });
    return;
  }
  next();
});

/* ---------- авторизация приложения ---------- */
app.use('/api/', (req, res, next) => {
  if (APP_TOKEN && req.header('x-app-token') !== APP_TOKEN) {
    res.status(401).json({ error: 'Неверный токен приложения.' });
    return;
  }
  next();
});

/* ---------- маршруты ---------- */
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'blnr-server' });
});

const ALLOWED_MEDIA_TYPES: ImageMediaType[] = ['image/jpeg', 'image/png', 'image/webp'];

app.post('/api/analyze', async (req, res) => {
  const { image, mediaType } = req.body ?? {};

  if (typeof image !== 'string' || image.length === 0) {
    res.status(400).json({ error: 'Поле image (base64) обязательно.' });
    return;
  }
  if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) {
    res.status(400).json({ error: `mediaType должен быть одним из: ${ALLOWED_MEDIA_TYPES.join(', ')}` });
    return;
  }

  try {
    const card = await analyzeClothingImage(image, mediaType);
    res.json({ card });
  } catch (e) {
    if (e instanceof RefusalError) {
      res.status(422).json({ error: e.message });
      return;
    }
    if (e instanceof Anthropic.APIError) {
      console.error(`Claude API error ${e.status}:`, e.message);
      res.status(502).json({ error: 'Сервис распознавания временно недоступен.' });
      return;
    }
    console.error('Unexpected error:', e);
    res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
  }
});

app.listen(PORT, () => {
  console.log(`BLNR server запущен: http://localhost:${PORT}`);
  console.log(`Авторизация приложения: ${APP_TOKEN ? 'включена (x-app-token)' : 'выключена (задайте APP_TOKEN)'}`);
});
