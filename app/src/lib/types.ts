export type Category =
  | 'top'
  | 'bottom'
  | 'dress'
  | 'outerwear'
  | 'shoes'
  | 'accessory'
  | 'bag'
  | 'headwear';

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

export type StyleTag =
  | 'casual'
  | 'business'
  | 'sport'
  | 'evening'
  | 'streetwear'
  | 'classic'
  | 'romantic'
  | 'minimalist';

export type Occasion =
  | 'work'
  | 'date'
  | 'party'
  | 'sport'
  | 'walk'
  | 'travel'
  | 'home'
  | 'formal';

export type Mood = 'confident' | 'relaxed' | 'playful' | 'cozy' | 'bold';

export interface ClothingAnalysis {
  name: string;
  category: Category;
  primaryColor: string;
  colors: string[];
  styles: StyleTag[];
  brand: string | null;
  material: string;
  seasons: Season[];
  /** 1 — очень лёгкая вещь, 5 — очень тёплая */
  warmth: number;
  /** 1 — максимально неформальная, 5 — строго формальная */
  formality: number;
  minTempC: number;
  maxTempC: number;
  occasions: Occasion[];
  description: string;
}

export interface ClothingItem extends ClothingAnalysis {
  id: string;
  imageUri: string;
  createdAt: number;
  /** true, если данные сгенерированы без ИИ (демо-режим) */
  isDraft?: boolean;
}

export interface WeatherSnapshot {
  tempC: number;
  feelsLikeC: number;
  precipitationMm: number;
  windKmh: number;
  weatherCode: number;
  description: string;
  city?: string;
}

export interface Outfit {
  id: string;
  title: string;
  itemIds: string[];
  reason: string;
  score: number;
  createdAt: number;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  top: 'Верх',
  bottom: 'Низ',
  dress: 'Платье',
  outerwear: 'Верхняя одежда',
  shoes: 'Обувь',
  accessory: 'Аксессуар',
  bag: 'Сумка',
  headwear: 'Головной убор',
};

export const STYLE_LABELS: Record<StyleTag, string> = {
  casual: 'Кэжуал',
  business: 'Деловой',
  sport: 'Спорт',
  evening: 'Вечерний',
  streetwear: 'Стритвир',
  classic: 'Классика',
  romantic: 'Романтичный',
  minimalist: 'Минимализм',
};

export const OCCASION_LABELS: Record<Occasion, string> = {
  work: 'Работа',
  date: 'Свидание',
  party: 'Вечеринка',
  sport: 'Тренировка',
  walk: 'Прогулка',
  travel: 'Путешествие',
  home: 'Дом',
  formal: 'Торжество',
};

export const MOOD_LABELS: Record<Mood, string> = {
  confident: 'Уверенное',
  relaxed: 'Расслабленное',
  playful: 'Игривое',
  cozy: 'Уютное',
  bold: 'Дерзкое',
};

export const SEASON_LABELS: Record<Season, string> = {
  winter: 'Зима',
  spring: 'Весна',
  summer: 'Лето',
  autumn: 'Осень',
};
