import type {
  ClothingItem,
  Mood,
  Occasion,
  Outfit,
  StyleTag,
  WeatherSnapshot,
} from '@/lib/types';
import { MOOD_LABELS, OCCASION_LABELS } from '@/lib/types';

export interface OutfitRequest {
  weather: WeatherSnapshot | null;
  occasion: Occasion;
  mood: Mood;
  preferredStyle?: StyleTag;
}

const OCCASION_FORMALITY: Record<Occasion, number> = {
  work: 4,
  date: 3,
  party: 3,
  sport: 1,
  walk: 2,
  travel: 2,
  home: 1,
  formal: 5,
};

const MOOD_STYLE_BONUS: Record<Mood, StyleTag[]> = {
  confident: ['business', 'classic'],
  relaxed: ['casual', 'minimalist'],
  playful: ['streetwear', 'romantic'],
  cozy: ['casual', 'minimalist'],
  bold: ['streetwear', 'evening'],
};

const NEUTRAL_COLORS = [
  'белый', 'чёрный', 'черный', 'серый', 'бежевый', 'кремовый', 'молочный',
  'графитовый', 'хаки', 'коричневый', 'тёмно-синий', 'темно-синий', 'деним',
];

function isNeutral(color: string): boolean {
  const c = color.toLowerCase();
  return NEUTRAL_COLORS.some((n) => c.includes(n));
}

/** Оценка вещи 0..1 для заданных условий. */
function scoreItem(item: ClothingItem, req: OutfitRequest): number {
  let score = 0.5;

  if (req.weather) {
    const t = req.weather.feelsLikeC;
    if (t >= item.minTempC && t <= item.maxTempC) {
      score += 0.3;
    } else {
      const dist = Math.min(Math.abs(t - item.minTempC), Math.abs(t - item.maxTempC));
      score -= Math.min(0.4, dist * 0.03);
    }
  }

  const targetFormality = OCCASION_FORMALITY[req.occasion];
  score += 0.25 - Math.abs(item.formality - targetFormality) * 0.1;

  if (item.occasions.includes(req.occasion)) score += 0.2;
  if (req.preferredStyle && item.styles.includes(req.preferredStyle)) score += 0.15;
  if (item.styles.some((s) => MOOD_STYLE_BONUS[req.mood].includes(s))) score += 0.1;

  return score;
}

/** Простая проверка цветовой совместимости: нейтральные сочетаются со всем. */
function colorsCompatible(a: ClothingItem, b: ClothingItem): boolean {
  if (isNeutral(a.primaryColor) || isNeutral(b.primaryColor)) return true;
  return a.primaryColor.toLowerCase() === b.primaryColor.toLowerCase()
    ? true
    : a.colors.some((c) => b.colors.map((x) => x.toLowerCase()).includes(c.toLowerCase()));
}

function pickBest(
  items: ClothingItem[],
  req: OutfitRequest,
  exclude: ClothingItem[] = [],
  mustMatch?: ClothingItem,
  offset = 0,
): ClothingItem | undefined {
  const ranked = items
    .filter((i) => !exclude.includes(i))
    .map((i) => ({ item: i, score: scoreItem(i, req) + (mustMatch && colorsCompatible(i, mustMatch) ? 0.15 : 0) }))
    .sort((a, b) => b.score - a.score);
  return ranked[offset]?.item ?? ranked[0]?.item;
}

function needsOuterwear(weather: WeatherSnapshot | null): boolean {
  if (!weather) return false;
  return weather.feelsLikeC < 15 || weather.precipitationMm > 0.2;
}

function buildReason(parts: ClothingItem[], req: OutfitRequest): string {
  const bits: string[] = [];
  if (req.weather) {
    bits.push(
      `На улице ${req.weather.tempC}°C (ощущается как ${req.weather.feelsLikeC}°C), ${req.weather.description.toLowerCase()}`,
    );
    if (needsOuterwear(req.weather) && parts.some((p) => p.category === 'outerwear')) {
      bits.push('добавила верхний слой');
    }
  }
  bits.push(`образ подобран под «${OCCASION_LABELS[req.occasion].toLowerCase()}»`);
  bits.push(`настроение — ${MOOD_LABELS[req.mood].toLowerCase()}`);
  const neutralBase = parts.filter((p) => isNeutral(p.primaryColor)).length >= 2;
  if (neutralBase) bits.push('нейтральная база легко сочетается между собой');
  return bits.join(', ') + '.';
}

/** Генерирует до трёх образов из гардероба. Работает локально, без сети. */
export function generateOutfits(items: ClothingItem[], req: OutfitRequest): Outfit[] {
  const byCat = (cat: ClothingItem['category']) => items.filter((i) => i.category === cat);

  const tops = byCat('top');
  const bottoms = byCat('bottom');
  const dresses = byCat('dress');
  const shoes = byCat('shoes');
  const outer = byCat('outerwear');
  const accessories = [...byCat('accessory'), ...byCat('bag'), ...byCat('headwear')];

  const outfits: Outfit[] = [];

  for (let variant = 0; variant < 3; variant++) {
    const parts: ClothingItem[] = [];

    const useDress = dresses.length > 0 && (variant === 1 || tops.length === 0 || bottoms.length === 0);
    if (useDress) {
      const dress = pickBest(dresses, req, [], undefined, variant);
      if (dress) parts.push(dress);
    } else {
      const top = pickBest(tops, req, [], undefined, variant);
      if (top) parts.push(top);
      const bottom = pickBest(bottoms, req, [], top, variant === 2 ? 1 : 0);
      if (bottom) parts.push(bottom);
    }

    if (parts.length === 0) break;

    const shoe = pickBest(shoes, req, [], parts[0]);
    if (shoe) parts.push(shoe);

    if (needsOuterwear(req.weather)) {
      const coat = pickBest(outer, req, [], parts[0]);
      if (coat) parts.push(coat);
    }

    if (accessories.length > 0 && variant !== 2) {
      const acc = pickBest(accessories, req, [], parts[0], variant);
      if (acc) parts.push(acc);
    }

    const ids = parts.map((p) => p.id);
    if (outfits.some((o) => o.itemIds.join() === ids.join())) continue;

    const avgScore = parts.reduce((sum, p) => sum + scoreItem(p, req), 0) / parts.length;
    outfits.push({
      id: `${Date.now()}-${variant}`,
      title: `Образ ${outfits.length + 1}`,
      itemIds: ids,
      reason: buildReason(parts, req),
      score: Math.round(Math.max(0, Math.min(1, avgScore)) * 100),
      createdAt: Date.now(),
    });
  }

  return outfits.sort((a, b) => b.score - a.score);
}
