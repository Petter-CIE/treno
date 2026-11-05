import type { ExtraLang } from '@/lib/types';
import da from './da';
import de from './de';
import es from './es';
import fi from './fi';
import fr from './fr';
import it from './it';
import pl from './pl';
import pt from './pt';
import sv from './sv';
import type { LocalePack } from './types';

export const LOCALES: Partial<Record<ExtraLang, LocalePack>> = { de, es, fr, pt, it, pl, sv, da, fi };

export const EXTRA_LANGS: ExtraLang[] = ['de', 'es', 'fr', 'pt', 'it', 'pl', 'sv', 'da', 'fi'];
