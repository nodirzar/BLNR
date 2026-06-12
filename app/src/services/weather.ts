import * as Location from 'expo-location';

import type { WeatherSnapshot } from '@/lib/types';

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'Ясно',
  1: 'Преимущественно ясно',
  2: 'Переменная облачность',
  3: 'Пасмурно',
  45: 'Туман',
  48: 'Изморозь',
  51: 'Лёгкая морось',
  53: 'Морось',
  55: 'Сильная морось',
  61: 'Небольшой дождь',
  63: 'Дождь',
  65: 'Сильный дождь',
  66: 'Ледяной дождь',
  71: 'Небольшой снег',
  73: 'Снег',
  75: 'Сильный снег',
  77: 'Снежная крупа',
  80: 'Кратковременный дождь',
  81: 'Ливень',
  82: 'Сильный ливень',
  85: 'Снегопад',
  86: 'Сильный снегопад',
  95: 'Гроза',
  96: 'Гроза с градом',
  99: 'Сильная гроза с градом',
};

export function describeWeatherCode(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? 'Погода неизвестна';
}

/** Текущая погода по координатам через бесплатный Open-Meteo (ключ не нужен). */
export async function fetchWeather(latitude: number, longitude: number): Promise<WeatherSnapshot> {
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${latitude}&longitude=${longitude}` +
    '&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Сервис погоды недоступен (${res.status})`);
  const data = await res.json();
  const c = data.current;
  return {
    tempC: Math.round(c.temperature_2m),
    feelsLikeC: Math.round(c.apparent_temperature),
    precipitationMm: c.precipitation ?? 0,
    windKmh: Math.round(c.wind_speed_10m ?? 0),
    weatherCode: c.weather_code ?? 0,
    description: describeWeatherCode(c.weather_code ?? 0),
  };
}

/** Погода по геолокации устройства. Возвращает null, если доступ не выдан. */
export async function fetchWeatherForCurrentLocation(): Promise<WeatherSnapshot | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Low,
  });
  const weather = await fetchWeather(pos.coords.latitude, pos.coords.longitude);
  const places = await Location.reverseGeocodeAsync(pos.coords).catch(() => []);
  if (places[0]?.city) weather.city = places[0].city;
  return weather;
}
