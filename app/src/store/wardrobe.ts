import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { ClothingItem, Outfit } from '@/lib/types';

interface WardrobeState {
  items: ClothingItem[];
  savedOutfits: Outfit[];
  addItem: (item: ClothingItem) => void;
  updateItem: (id: string, patch: Partial<ClothingItem>) => void;
  removeItem: (id: string) => void;
  saveOutfit: (outfit: Outfit) => void;
  removeOutfit: (id: string) => void;
}

export const useWardrobe = create<WardrobeState>()(
  persist(
    (set) => ({
      items: [],
      savedOutfits: [],
      addItem: (item) => set((s) => ({ items: [item, ...s.items] })),
      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
        })),
      removeItem: (id) =>
        set((s) => ({
          items: s.items.filter((it) => it.id !== id),
          savedOutfits: s.savedOutfits.filter((o) => !o.itemIds.includes(id)),
        })),
      saveOutfit: (outfit) => set((s) => ({ savedOutfits: [outfit, ...s.savedOutfits] })),
      removeOutfit: (id) =>
        set((s) => ({ savedOutfits: s.savedOutfits.filter((o) => o.id !== id) })),
    }),
    {
      name: 'blnr-wardrobe',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
