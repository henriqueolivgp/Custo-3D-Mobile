import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { createStore } from './createStore';
import type { StoreState } from './createStore';

export const store = createStore(AsyncStorage);

/** Lê uma fatia do estado. O seletor deve devolver uma referência já existente (nunca um objeto novo). */
export function useStore<T>(selector: (s: StoreState) => T): T {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
}

// Garante que nada se perde ao sair da app.
AppState.addEventListener('change', (status) => {
  if (status !== 'active') void store.flush();
});
