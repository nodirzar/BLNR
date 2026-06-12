import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen, Subtitle, Title } from '@/components/ui';
import { palette, radius, spacing } from '@/lib/theme';
import { useSettings } from '@/store/settings';
import { useWardrobe } from '@/store/wardrobe';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    anthropicApiKey,
    proxyUrl,
    proxyToken,
    userName,
    setApiKey,
    setProxyUrl,
    setProxyToken,
    setUserName,
  } = useSettings();
  const itemCount = useWardrobe((s) => s.items.length);
  const outfitCount = useWardrobe((s) => s.savedOutfits.length);

  return (
    <Screen style={{ paddingTop: insets.top }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Title>Профиль</Title>
        <Subtitle>
          {itemCount} вещей · {outfitCount} сохранённых образов
        </Subtitle>

        <Text style={styles.label}>Как вас зовут</Text>
        <TextInput
          style={styles.input}
          value={userName}
          onChangeText={setUserName}
          placeholder="Имя"
          placeholderTextColor={palette.muted}
        />

        <Text style={styles.label}>Сервер BLNR (рекомендуется)</Text>
        <TextInput
          style={styles.input}
          value={proxyUrl}
          onChangeText={setProxyUrl}
          placeholder="https://blnr.example.com"
          placeholderTextColor={palette.muted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <TextInput
          style={[styles.input, { marginTop: spacing(2) }]}
          value={proxyToken}
          onChangeText={setProxyToken}
          placeholder="Токен приложения (x-app-token)"
          placeholderTextColor={palette.muted}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        <Text style={styles.hint}>
          Backend-прокси из каталога server/ репозитория: ключ Claude хранится на сервере и не
          попадает в приложение. Если адрес задан, распознавание идёт через сервер.
        </Text>

        <Text style={styles.label}>Ключ Claude API (альтернатива)</Text>
        <TextInput
          style={styles.input}
          value={anthropicApiKey}
          onChangeText={setApiKey}
          placeholder="sk-ant-…"
          placeholderTextColor={palette.muted}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />
        <Text style={styles.hint}>
          Прямые запросы к Claude API с устройства — удобно для разработки. Используется, только
          если адрес сервера не задан. Ключ хранится только на этом устройстве.
        </Text>

        <View style={styles.about}>
          <Text style={styles.aboutTitle}>BLNR — карманный стилист</Text>
          <Text style={styles.aboutText}>
            Фотографируйте одежду, ИИ распознаёт её и запоминает цвет, стиль, бренд, материал и
            подходящую погоду. Приложение собирает образы под погоду, событие и настроение.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    color: palette.sand,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing(4),
    marginBottom: spacing(2),
  },
  input: {
    backgroundColor: palette.card,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: radius.md,
    color: palette.cream,
    fontSize: 15,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3.5),
  },
  hint: { color: palette.muted, fontSize: 13, lineHeight: 19, marginTop: spacing(2) },
  about: {
    backgroundColor: palette.card,
    borderColor: palette.line,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing(4),
    marginTop: spacing(8),
    marginBottom: spacing(8),
  },
  aboutTitle: { color: palette.cream, fontSize: 16, fontWeight: '700' },
  aboutText: { color: palette.sand, fontSize: 13, lineHeight: 19, marginTop: spacing(2) },
});
