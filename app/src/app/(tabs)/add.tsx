import { File, Paths } from 'expo-file-system';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, Screen, Subtitle, Title } from '@/components/ui';
import { palette, radius, spacing } from '@/lib/theme';
import type { ClothingItem } from '@/lib/types';
import { analyzeClothingImage, draftAnalysis } from '@/services/ai';
import { useSettings } from '@/store/settings';
import { useWardrobe } from '@/store/wardrobe';

interface PickedImage {
  uri: string;
  base64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}

export default function AddItemScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const apiKey = useSettings((s) => s.anthropicApiKey);
  const addItem = useWardrobe((s) => s.addItem);

  const [image, setImage] = useState<PickedImage | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const pickerOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 0.7,
    base64: true,
    allowsEditing: true,
  };

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Нет доступа к камере', 'Разрешите доступ к камере в настройках устройства.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync(pickerOptions);
    handlePickerResult(result);
  }

  async function pickFromLibrary() {
    const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
    handlePickerResult(result);
  }

  function handlePickerResult(result: ImagePicker.ImagePickerResult) {
    if (result.canceled || !result.assets[0]?.base64) return;
    const asset = result.assets[0];
    const mime = asset.mimeType === 'image/png' || asset.mimeType === 'image/webp'
      ? asset.mimeType
      : 'image/jpeg';
    setImage({ uri: asset.uri, base64: asset.base64!, mimeType: mime });
  }

  async function analyzeAndSave() {
    if (!image) return;
    setBusy(true);
    try {
      setStatus(apiKey ? 'ИИ изучает вашу вещь…' : 'Создаю черновик карточки…');
      const analysis = apiKey
        ? await analyzeClothingImage(apiKey, image.base64, image.mimeType)
        : draftAnalysis();

      setStatus('Сохраняю…');
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const ext = image.mimeType === 'image/png' ? 'png' : 'jpg';
      const stored = new File(Paths.document, `wardrobe-${id}.${ext}`);
      new File(image.uri).copy(stored);

      const item: ClothingItem = {
        ...analysis,
        id,
        imageUri: stored.uri,
        createdAt: Date.now(),
        isDraft: !apiKey,
      };
      addItem(item);
      setImage(null);
      router.push(`/item/${id}`);
    } catch (e) {
      Alert.alert('Не получилось', e instanceof Error ? e.message : 'Неизвестная ошибка');
    } finally {
      setBusy(false);
      setStatus('');
    }
  }

  return (
    <Screen style={{ paddingTop: insets.top }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Title>Новая вещь</Title>
        <Subtitle>
          Сфотографируйте предмет одежды — ИИ определит категорию, цвет, стиль, бренд, материал и
          подходящую погоду.
        </Subtitle>

        <View style={styles.preview}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.previewImage} contentFit="cover" />
          ) : (
            <Text style={{ fontSize: 56 }}>👕</Text>
          )}
        </View>

        {busy ? (
          <View style={styles.busyBox}>
            <ActivityIndicator color={palette.terracotta} />
            <Text style={styles.busyText}>{status}</Text>
          </View>
        ) : (
          <View style={{ gap: spacing(3), marginTop: spacing(5) }}>
            <PrimaryButton label="📷  Сделать фото" onPress={takePhoto} />
            <PrimaryButton label="🖼  Выбрать из галереи" onPress={pickFromLibrary} />
            {image && <PrimaryButton label="✨  Распознать и сохранить" onPress={analyzeAndSave} />}
          </View>
        )}

        {!apiKey && (
          <Text style={styles.hint}>
            Без ключа Claude API вещь сохранится черновиком — заполните карточку вручную или добавьте
            ключ на вкладке «Профиль».
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: {
    height: 320,
    borderRadius: radius.lg,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewImage: { width: '100%', height: '100%' },
  busyBox: { alignItems: 'center', gap: spacing(3), marginTop: spacing(8) },
  busyText: { color: palette.sand, fontSize: 15 },
  hint: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing(5),
    marginBottom: spacing(8),
  },
});
