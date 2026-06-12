# BLNR — карманный стилист

ИИ-гардероб для Android и iOS + промо-сайт с 3D motion-эффектами.

**Идея:** пользователь фотографирует свою одежду — встроенный ИИ (Claude) распознаёт,
что это за вещь, и запоминает цвет, стиль, бренд, материал, сезонность и подходящую
погоду. Приложение собирает готовые образы из гардероба с учётом погоды за окном,
события и настроения.

## Структура репозитория

```
app/      — мобильное приложение (Expo / React Native, TypeScript)
server/   — backend-прокси: держит ключ Claude API на сервере (Node + Express)
website/  — лендинг с 3D-сценой на Three.js (статический сайт)
```

---

## Мобильное приложение (`app/`)

Одна кодовая база для **Android** и **iOS** на Expo SDK 56 + expo-router.

### Возможности

- **Гардероб** — каталог вещей с фото и фильтрами по категориям.
- **Добавление вещи** — фото с камеры или из галереи; ИИ-анализ через Claude API
  (vision + structured outputs): категория, цвет, стиль, бренд, материал, сезон,
  диапазон комфортной температуры, формальность, подходящие события.
- **Образы** — локальный движок подбора: учитывает текущую погоду
  (Open-Meteo по геолокации, без ключа), событие, настроение, цветовую
  совместимость и формальность. Работает офлайн.
- **Демо-режим** — без ключа API вещи сохраняются черновиками, всё остальное работает.
- Данные хранятся только на устройстве (AsyncStorage + файловая система).

### Запуск

```bash
cd app
npm install
npm start          # Expo Dev Server; откройте в Expo Go или эмуляторе
npm run android    # Android
npm run ios        # iOS (нужен macOS)
```

### Подключение ИИ

Два способа, настраиваются на вкладке **Профиль**:

1. **Сервер BLNR (рекомендуется)** — укажите адрес backend-прокси из каталога
   [`server/`](server/README.md) и токен приложения. Ключ Claude API остаётся
   на сервере и в приложение не попадает.
2. **Прямой ключ Claude API** — для разработки: вставьте ключ из
   [platform.claude.com](https://platform.claude.com), он хранится только на устройстве.

### Сборка релиза

Через [EAS Build](https://docs.expo.dev/build/introduction/):

```bash
npx eas build --platform android
npx eas build --platform ios
```

---

## Backend-прокси (`server/`)

Node + Express + `@anthropic-ai/sdk`. Эндпоинт `POST /api/analyze` принимает фото
в base64 и возвращает карточку вещи. Авторизация по общему секрету (`APP_TOKEN`),
rate limit 10 запросов/мин на IP. Подробности и деплой: [server/README.md](server/README.md).

```bash
cd server && npm install
ANTHROPIC_API_KEY=sk-ant-... APP_TOKEN=секрет npm run dev
```

---

## Сайт (`website/`)

Статический лендинг без сборки: Three.js лежит локально в `js/vendor/`
(не зависит от CDN), UI-анимации работают даже без WebGL.

**3D motion-эффекты:**
- анимированная «шёлковая ткань» на вершинном шейдере (GLSL);
- поле частиц с аддитивным свечением;
- параллакс камеры от движения мыши;
- погружение камеры в сцену при скролле;
- reveal-анимации секций (IntersectionObserver) и 3D-tilt карточек;
- уважает `prefers-reduced-motion`.

### Запуск

```bash
cd website
python3 -m http.server 8080
# откройте http://localhost:8080
```

Деплой: любой статический хостинг (GitHub Pages, Netlify, Vercel).

---

## Технологии

| Часть | Стек |
|---|---|
| Приложение | Expo SDK 56, React Native 0.85, expo-router, zustand, expo-image-picker, expo-location |
| ИИ | Claude API (`claude-opus-4-8`), vision + structured outputs (`@anthropic-ai/sdk`) |
| Погода | Open-Meteo (бесплатно, без ключа) |
| Сайт | Three.js (шейдеры GLSL), ванильный JS/CSS, Google Fonts (Unbounded, Manrope) |
