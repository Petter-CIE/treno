import type { ExtraLang } from '@/lib/types';
import type { LocalePack } from './types';

export const LOCALES: Partial<Record<ExtraLang, LocalePack>> = {};

export const EXTRA_LANGS: ExtraLang[] = ['de', 'es', 'fr', 'pt', 'it', 'pl', 'sv', 'da', 'fi'];
