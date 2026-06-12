import Anthropic from '@anthropic-ai/sdk';

import type { ClothingAnalysis } from '@/lib/types';

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Короткое название вещи на русском, например «Бежевый шерстяной свитер»' },
    category: {
      type: 'string',
      enum: ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory', 'bag', 'headwear'],
    },
    primaryColor: { type: 'string', description: 'Основной цвет на русском' },
    colors: { type: 'array', items: { type: 'string' }, description: 'Все заметные цвета на русском' },
    styles: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['casual', 'business', 'sport', 'evening', 'streetwear', 'classic', 'romantic', 'minimalist'],
      },
    },
    brand: {
      anyOf: [{ type: 'string' }, { type: 'null' }],
      description: 'Бренд, если виден логотип или узнаваемый дизайн, иначе null',
    },
    material: { type: 'string', description: 'Предполагаемый материал на русском' },
    seasons: {
      type: 'array',
      items: { type: 'string', enum: ['winter', 'spring', 'summer', 'autumn'] },
    },
    warmth: { type: 'integer', enum: [1, 2, 3, 4, 5], description: '1 — очень лёгкая, 5 — очень тёплая' },
    formality: { type: 'integer', enum: [1, 2, 3, 4, 5], description: '1 — неформальная, 5 — строгая' },
    minTempC: { type: 'integer', description: 'Минимальная комфортная температура воздуха, °C' },
    maxTempC: { type: 'integer', description: 'Максимальная комфортная температура воздуха, °C' },
    occasions: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['work', 'date', 'party', 'sport', 'walk', 'travel', 'home', 'formal'],
      },
    },
    description: { type: 'string', description: '1–2 предложения: что это и с чем сочетать, на русском' },
  },
  required: [
    'name', 'category', 'primaryColor', 'colors', 'styles', 'brand', 'material',
    'seasons', 'warmth', 'formality', 'minTempC', 'maxTempC', 'occasions', 'description',
  ],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT =
  'Ты — профессиональный стилист и эксперт по одежде. Тебе присылают фотографию одного предмета одежды, ' +
  'обуви или аксессуара. Определи, что это, и заполни карточку вещи максимально точно. ' +
  'Бренд указывай только если он действительно различим на фото. Все текстовые поля — на русском языке.';

export async function analyzeClothingImage(
  apiKey: string,
  base64Image: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
): Promise<ClothingAnalysis> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    output_config: { format: { type: 'json_schema', schema: ANALYSIS_SCHEMA } },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Image } },
          { type: 'text', text: 'Проанализируй этот предмет одежды и заполни карточку.' },
        ],
      },
    ],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('ИИ не смог обработать это изображение. Попробуйте другое фото.');
  }

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Пустой ответ от ИИ. Попробуйте ещё раз.');
  }
  return JSON.parse(textBlock.text) as ClothingAnalysis;
}

/**
 * Заглушка для демо-режима (без ключа API): создаёт черновик карточки,
 * который пользователь заполняет вручную.
 */
export function draftAnalysis(): ClothingAnalysis {
  return {
    name: 'Новая вещь',
    category: 'top',
    primaryColor: 'не указан',
    colors: [],
    styles: ['casual'],
    brand: null,
    material: 'не указан',
    seasons: ['spring', 'autumn'],
    warmth: 3,
    formality: 2,
    minTempC: 10,
    maxTempC: 20,
    occasions: ['walk'],
    description: 'Добавьте ключ Claude API в настройках, чтобы ИИ заполнял карточки автоматически.',
  };
}
