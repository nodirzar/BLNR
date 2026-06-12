import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SettingsState {
  /** Ключ Claude API. Пусто — приложение работает в демо-режиме без ИИ. */
  anthropicApiKey: string;
  userName: string;
  setApiKey: (key: string) => void;
  setUserName: (name: string) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      anthropicApiKey: '',
      userName: '',
      setApiKey: (anthropicApiKey) => set({ anthropicApiKey: anthropicApiKey.trim() }),
      setUserName: (userName) => set({ userName }),
    }),
    {
      name: 'blnr-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
