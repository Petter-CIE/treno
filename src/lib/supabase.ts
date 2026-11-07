import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import { SUPABASE_KEY, SUPABASE_URL } from './config';

// static web rendering runs without window – keep storage calls harmless there
const isSSR = Platform.OS === 'web' && typeof window === 'undefined';
const storage = {
  getItem: (k: string) => (isSSR ? Promise.resolve(null) : AsyncStorage.getItem(k)),
  setItem: (k: string, v: string) => (isSSR ? Promise.resolve() : AsyncStorage.setItem(k, v)),
  removeItem: (k: string) => (isSSR ? Promise.resolve() : AsyncStorage.removeItem(k)),
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { storage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

// refresh the session only while the app is in the foreground
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (s) => {
    if (s === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
