import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip, EmptyState, PrimaryButton, Screen, Subtitle, Title } from '@/components/ui';
import { palette, radius, spacing } from '@/lib/theme';
import {
  MOOD_LABELS,
  OCCASION_LABELS,
  type Mood,
  type Occasion,
  type Outfit,
  type WeatherSnapshot,
} from '@/lib/types';
import { generateOutfits } from '@/services/outfit-engine';
import { fetchWeatherForCurrentLocation } from '@/services/weather';
import { useWardrobe } from '@/store/wardrobe';

const OCCASIONS = Object.entries(OCCASION_LABELS) as [Occasion, string][];
const MOODS = Object.entries(MOOD_LABELS) as [Mood, string][];

export default function OutfitsScreen() {
  const insets = useSafeAreaInsets();
  const items = useWardrobe((s) => s.items);

  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [weatherFailed, setWeatherFailed] = useState(false);
  const [occasion, setOccasion] = useState<Occasion>('walk');
  const [mood, setMood] = useState<Mood>('relaxed');
  const [outfits, setOutfits] = useState<Outfit[]>([]);

  useEffect(() => {
    fetchWeatherForCurrentLocation()
      .then((w) => (w ? setWeather(w) : setWeatherFailed(true)))
      .catch(() => setWeatherFailed(true));
  }, []);

  function generate() {
    setOutfits(generateOutfits(items, { weather, occasion, mood }));
  }

  return (
    <Screen style={{ paddingTop: insets.top }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing(8) }}>
        <Title>Образы</Title>
        <Subtitle>Подбор с учётом погоды, события и настроения</Subtitle>

        <WeatherCard weather={weather} failed={weatherFailed} />

        <Text style={styles.sectionLabel}>Куда собираетесь?</Text>
        <View style={styles.chipRow}>
          {OCCASIONS.map(([key, label]) => (
            <Chip key={key} label={label} active={occasion === key} onPress={() => setOccasion(key)} />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Настроение</Text>
        <View style={styles.chipRow}>
          {MOODS.map(([key, label]) => (
            <Chip key={key} label={label} active={mood === key} onPress={() => setMood(key)} />
          ))}
        </View>

        <View style={{ marginTop: spacing(4) }}>
          <PrimaryButton
            label="✨  Собрать образы"
            onPress={generate}
            disabled={items.length < 2}
          />
        </View>

        {items.length < 2 ? (
          <EmptyState
            emoji="🪞"
            text="Добавьте хотя бы пару вещей в гардероб, и стилист соберёт из них образы."
          />
        ) : (
          outfits.map((o) => <OutfitCard key={o.id} outfit={o} />)
        )}
      </ScrollView>
    </Screen>
  );
}

function WeatherCard({ weather, failed }: { weather: WeatherSnapshot | null; failed: boolean }) {
  return (
    <View style={styles.weather}>
      {weather ? (
        <>
          <Text style={styles.weatherTemp}>{weather.tempC}°C</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.weatherDesc}>
              {weather.description}
              {weather.city ? ` · ${weather.city}` : ''}
            </Text>
            <Text style={styles.weatherMeta}>
              Ощущается как {weather.feelsLikeC}°C · ветер {weather.windKmh} км/ч
            </Text>
          </View>
        </>
      ) : (
        <Text style={styles.weatherMeta}>
          {failed
            ? 'Погода недоступна — образы соберём без неё.'
            : 'Узнаю погоду по вашей геолокации…'}
        </Text>
      )}
    </View>
  );
}

function OutfitCard({ outfit }: { outfit: Outfit }) {
  const router = useRouter();
  const items = useWardrobe((s) => s.items);
  const saveOutfit = useWardrobe((s) => s.saveOutfit);
  const parts = outfit.itemIds
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is NonNullable<typeof i> => Boolean(i));

  return (
    <View style={styles.outfit}>
      <View style={styles.outfitHeader}>
        <Text style={styles.outfitTitle}>{outfit.title}</Text>
        <Text style={styles.outfitScore}>{outfit.score}% совпадение</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {parts.map((p) => (
          <Pressable key={p.id} onPress={() => router.push(`/item/${p.id}`)}>
            <Image source={{ uri: p.imageUri }} style={styles.outfitPhoto} contentFit="cover" />
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.outfitReason}>{outfit.reason}</Text>
      <Pressable onPress={() => saveOutfit(outfit)} style={styles.saveLink}>
        <Text style={styles.saveLinkText}>Сохранить образ</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    color: palette.sand,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing(4),
    marginBottom: spacing(2),
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  weather: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(4),
    backgroundColor: palette.card,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing(4),
  },
  weatherTemp: { color: palette.terracottaSoft, fontSize: 32, fontWeight: '700' },
  weatherDesc: { color: palette.cream, fontSize: 15, fontWeight: '600' },
  weatherMeta: { color: palette.muted, fontSize: 13, marginTop: 2 },
  outfit: {
    backgroundColor: palette.card,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing(4),
    marginTop: spacing(4),
  },
  outfitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing(3),
  },
  outfitTitle: { color: palette.cream, fontSize: 17, fontWeight: '700' },
  outfitScore: { color: palette.sage, fontSize: 13, fontWeight: '600' },
  outfitPhoto: {
    width: 96,
    height: 120,
    borderRadius: radius.sm,
    marginRight: spacing(2),
    backgroundColor: palette.charcoal,
  },
  outfitReason: { color: palette.sand, fontSize: 13, lineHeight: 19, marginTop: spacing(3) },
  saveLink: { marginTop: spacing(3) },
  saveLinkText: { color: palette.terracotta, fontSize: 14, fontWeight: '600' },
});
