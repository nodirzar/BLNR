import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
  /**
   * Адрес backend-прокси (каталог server/ в репозитории), например
   * https://blnr.example.com. Рекомендуемый способ: ключ Claude остаётся на сервере.
   */
  proxyUrl: string;
  /** Секрет приложения для прокси (заголовок x-app-token). */
  proxyToken: string;
  /** Ключ Claude API для прямых запросов. Используется, только если прокси не задан. */
  anthropicApiKey: string;
  userName: string;
  setProxyUrl: (url: string) => void;
  setProxyToken: (token: string) => void;
  setApiKey: (key: string) => void;
  setUserName: (name: string) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      proxyUrl: '',
      proxyToken: '',
      anthropicApiKey: '',
      userName: '',
      setProxyUrl: (proxyUrl) => set({ proxyUrl: proxyUrl.trim().replace(/\/+$/, '') }),
      setProxyToken: (proxyToken) => set({ proxyToken: proxyToken.trim() }),
      setApiKey: (anthropicApiKey) => set({ anthropicApiKey: anthropicApiKey.trim() }),
      setUserName: (userName) => set({ userName }),
    }),
    {
      name: 'blnr-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
