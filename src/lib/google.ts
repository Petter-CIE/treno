import { Platform, TurboModuleRegistry } from 'react-native';
import { GOOGLE_WEB_CLIENT_ID } from './config';

/**
 * Native Google sign-in (Android). The module is not part of Expo Go, so it is loaded lazily and
 * the button is only shown when the native module exists (store / EAS builds).
 */
export const googleAvailable = Platform.OS === 'android' && !!TurboModuleRegistry.get('RNGoogleSignin');

type Lib = typeof import('@react-native-google-signin/google-signin');
let lib: Lib | null = null;
function load(): Lib {
  if (!lib) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy: the module is missing in Expo Go
    lib = require('@react-native-google-signin/google-signin') as Lib;
    lib.GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
  }
  return lib;
}

/** Opens the Google account picker. Returns an ID token, null if the user cancelled. */
export async function googleIdToken(): Promise<string | null> {
  const { GoogleSignin, isSuccessResponse } = load();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const res = await GoogleSignin.signIn();
  if (!isSuccessResponse(res)) return null;
  return res.data.idToken ?? null;
}

export async function googleSignOut() {
  if (!googleAvailable) return;
  try {
    await load().GoogleSignin.signOut();
  } catch {
    // not signed in with Google
  }
}
