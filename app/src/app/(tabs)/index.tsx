import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip, EmptyState, Screen, Subtitle, Title } from '@/components/ui';
import { palette, radius, spacing } from '@/lib/theme';
import { CATEGORY_LABELS, type Category, type ClothingItem } from '@/lib/types';
import { useWardrobe } from '@/store/wardrobe';

const CATEGORIES = Object.entries(CATEGORY_LABELS) as [Category, string][];

export default function WardrobeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const items = useWardrobe((s) => s.items);
  const [filter, setFilter] = useState<Category | null>(null);

  const visible = useMemo(
    () => (filter ? items.filter((i) => i.category === filter) : items),
    [items, filter],
  );

  return (
    <Screen style={{ paddingTop: insets.top }}>
      <Title>Гардероб</Title>
      <Subtitle>
        {items.length === 0
          ? 'Пока пусто — добавьте первую вещь'
          : `${items.length} ${pluralize(items.length)} в коллекции`}
      </Subtitle>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip label="Все" active={filter === null} onPress={() => setFilter(null)} />
          {CATEGORIES.map(([cat, label]) => (
            <Chip key={cat} label={label} active={filter === cat} onPress={() => setFilter(cat)} />
          ))}
        </ScrollView>
      </View>

      {visible.length === 0 ? (
        <EmptyState
          emoji="🧺"
          text={
            items.length === 0
              ? 'Сфотографируйте одежду на вкладке «Добавить» — ИИ распознает её и заполнит карточку.'
              : 'В этой категории пока нет вещей.'
          }
        />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(i) => i.id}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing(3) }}
          contentContainerStyle={{ gap: spacing(3), paddingVertical: spacing(3), paddingBottom: spacing(8) }}
          renderItem={({ item }) => (
            <ItemCard item={item} onPress={() => router.push(`/item/${item.id}`)} />
          )}
        />
      )}
    </Screen>
  );
}

function ItemCard({ item, onPress }: { item: ClothingItem; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} onPress={onPress}>
      <Image source={{ uri: item.imageUri }} style={styles.photo} contentFit="cover" transition={150} />
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {CATEGORY_LABELS[item.category]} · {item.primaryColor}
        </Text>
      </View>
    </Pressable>
  );
}

function pluralize(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'вещь';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'вещи';
  return 'вещей';
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.line,
  },
  photo: { width: '100%', aspectRatio: 0.85, backgroundColor: palette.charcoal },
  cardBody: { padding: spacing(3) },
  cardName: { color: palette.cream, fontSize: 14, fontWeight: '600' },
  cardMeta: { color: palette.muted, fontSize: 12, marginTop: 2 },
});
