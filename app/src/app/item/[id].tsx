import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui';
import { palette, radius, spacing } from '@/lib/theme';
import {
  CATEGORY_LABELS,
  OCCASION_LABELS,
  SEASON_LABELS,
  STYLE_LABELS,
} from '@/lib/types';
import { useWardrobe } from '@/store/wardrobe';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const item = useWardrobe((s) => s.items.find((i) => i.id === id));
  const removeItem = useWardrobe((s) => s.removeItem);

  if (!item) {
    return (
      <Screen style={styles.center}>
        <Text style={{ color: palette.muted }}>Вещь не найдена</Text>
      </Screen>
    );
  }

  function confirmDelete() {
    Alert.alert('Удалить вещь?', 'Она исчезнет из гардероба и сохранённых образов.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          removeItem(item!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: item.name }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing(10) }}>
        <Image source={{ uri: item.imageUri }} style={styles.photo} contentFit="cover" />

        <Text style={styles.name}>{item.name}</Text>
        {item.isDraft && (
          <Text style={styles.draft}>Черновик — карточка создана без ИИ-анализа</Text>
        )}
        <Text style={styles.description}>{item.description}</Text>

        <Row label="Категория" value={CATEGORY_LABELS[item.category]} />
        <Row label="Цвет" value={item.colors.length ? item.colors.join(', ') : item.primaryColor} />
        <Row label="Стиль" value={item.styles.map((s) => STYLE_LABELS[s]).join(', ')} />
        <Row label="Бренд" value={item.brand ?? 'Не определён'} />
        <Row label="Материал" value={item.material} />
        <Row label="Сезон" value={item.seasons.map((s) => SEASON_LABELS[s]).join(', ')} />
        <Row label="Погода" value={`от ${item.minTempC}°C до ${item.maxTempC}°C`} />
        <Row label="Теплота" value={'🔥'.repeat(item.warmth) + '·'.repeat(5 - item.warmth)} />
        <Row label="Формальность" value={'★'.repeat(item.formality) + '☆'.repeat(5 - item.formality)} />
        <Row label="Подходит для" value={item.occasions.map((o) => OCCASION_LABELS[o]).join(', ')} />

        <Pressable onPress={confirmDelete} style={styles.deleteButton}>
          <Text style={styles.deleteText}>Удалить из гардероба</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  photo: {
    width: '100%',
    aspectRatio: 0.9,
    borderRadius: radius.lg,
    marginTop: spacing(4),
    backgroundColor: palette.charcoal,
  },
  name: { color: palette.cream, fontSize: 24, fontWeight: '700', marginTop: spacing(4) },
  draft: { color: palette.terracottaSoft, fontSize: 13, marginTop: spacing(1) },
  description: { color: palette.sand, fontSize: 14, lineHeight: 21, marginTop: spacing(2), marginBottom: spacing(4) },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing(4),
    paddingVertical: spacing(3),
    borderBottomWidth: 1,
    borderBottomColor: palette.line,
  },
  rowLabel: { color: palette.muted, fontSize: 14 },
  rowValue: { color: palette.cream, fontSize: 14, flexShrink: 1, textAlign: 'right' },
  deleteButton: { marginTop: spacing(6), alignItems: 'center' },
  deleteText: { color: palette.danger, fontSize: 15, fontWeight: '600' },
});
