import Anthropic from '@anthropic-ai/sdk';

export type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/webp';

/**
 * Схема карточки вещи. Должна совпадать с ClothingAnalysis
 * в мобильном приложении (app/src/lib/types.ts).
 */
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

const client = new Anthropic(); // читает ANTHROPIC_API_KEY из окружения

export class RefusalError extends Error {}

export async function analyzeClothingImage(
  base64Image: string,
  mediaType: ImageMediaType,
): Promise<unknown> {
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
    throw new RefusalError('ИИ не смог обработать это изображение.');
  }

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Пустой ответ модели');
  }
  return JSON.parse(textBlock.text);
}
