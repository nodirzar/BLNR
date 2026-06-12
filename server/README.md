# BLNR Server — backend-прокси для Claude API

Тонкий сервис, который держит ключ Claude API **на сервере** и анализирует фото
одежды для мобильного приложения. Благодаря ему ключ не попадает в приложение.

## Запуск

```bash
cd server
npm install

# режим разработки (перезапуск при изменениях)
ANTHROPIC_API_KEY=sk-ant-... APP_TOKEN=любой-секрет npm run dev

# продакшен
npm run build
ANTHROPIC_API_KEY=sk-ant-... APP_TOKEN=любой-секрет npm start
```

Переменные окружения:

| Переменная | Обязательна | Описание |
|---|---|---|
| `ANTHROPIC_API_KEY` | да | Ключ Claude API (platform.claude.com) |
| `APP_TOKEN` | рекомендуется | Общий секрет: приложение шлёт его в заголовке `x-app-token` |
| `PORT` | нет | Порт, по умолчанию 3000 |

## API

### `GET /health`

Проверка живости: `{ "ok": true, "service": "blnr-server" }`

### `POST /api/analyze`

Заголовки: `Content-Type: application/json`, `x-app-token: <APP_TOKEN>` (если задан).

Тело:

```json
{ "image": "<base64 фото>", "mediaType": "image/jpeg" }
```

Ответ `200`:

```json
{ "card": { "name": "…", "category": "top", "primaryColor": "…", "...": "…" } }
```

Ошибки: `400` (неверный запрос), `401` (нет/неверный токен), `422` (ИИ отказался
обрабатывать фото), `429` (rate limit, 10 запросов/мин на IP), `502` (Claude API недоступен).

## Подключение приложения

В приложении на вкладке **Профиль** укажите «Адрес сервера» (например,
`https://your-host.example.com`) и токен приложения. После этого распознавание
идёт через сервер, ключ Claude в приложении не нужен.

## Деплой

Любая Node 20+ платформа: Railway, Fly.io, Render, VPS + systemd/Docker.
Минимальный Dockerfile:

```dockerfile
FROM node:22-slim
WORKDIR /srv
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev
COPY dist ./dist
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

(перед сборкой образа выполните `npm run build`)
