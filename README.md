# Varde Fitness – tréninkový parťák

Mobilní aplikace pro Android a iOS (Expo / React Native) pro plánování a vedení tréninku: kettlebell, posilovna, vlastní váha, kalistenika, kardio, běh a mobilita. Jazyky: čeština, norština (bokmål), angličtina, němčina, španělština, francouzština, portugalština (BR), italština, polština, švédština, dánština a finština.

> Název: **Varde Fitness** (norsky *varde* – kamenná mohyla, která ukazuje cestu). Powered by Norgain.

## Co appka umí (verze 1.0)

- **Úvodní nastavení** – disciplíny, vybavení (vč. vlastních kettlebellů), tréninkové dny, týdenní cíl.
- **Dnes** – dnešní trénink, týdenní přehled, série splněných týdnů, rychlý start (Tabata, EMOM, AMRAP, vlastní).
- **Plán** – týdenní kalendář, ruční přidávání tréninků, 10 hotových programů (posilovna, PPL, doma, první shyb, kalistenika, od nuly na 5 km, kettlebell, HIIT, mobilita).
- **Časovač** – série s pauzami, EMOM, AMRAP s počítáním kol, intervaly, běh/chůze, souvislé kardio. Hlasový trenér v jazyce appky, vibrace, displej nezhasne.
- **Knihovna cviků** – 63 cviků s vlastními animacemi a popisem techniky, filtr a vyhledávání.
- **Deník** – zápis vah, vzdálenosti a tempa, RPE, poznámky, týdenní minuty, graf progresu u každého cviku.
- **Připomínky** – lokální notifikace v tréninkové dny.
- Data jsou jen v telefonu (AsyncStorage). Žádný účet, žádný server.
- **Dobrovolná podpora** – tlačítko v Nastavení otevře web s Vipps / PayPal. Zobrazí se, jakmile je vyplněné `SUPPORT_URL` v `src/lib/config.ts`. Dar nic neodemyká (pravidla App Store / Google Play).

## Spuštění

```bash
npm install
npx expo start          # Expo Go / development build
npx tsc --noEmit        # typecheck
npx expo lint           # lint
npx tsx scripts/check-data.ts   # kontrola obsahu (cviky, tréninky, programy, animace)
npx tsx --tsconfig tsconfig.json scripts/check-locales.ts   # kontrola překladů
```

## Build a publikace

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform all --profile production
npx eas-cli@latest submit --platform ios
npx eas-cli@latest submit --platform android
```

Potřebuješ Apple Developer účet (99 USD/rok) a Google Play Console (jednorázově 25 USD). Bundle ID: `no.cie.varde`.

## Struktura

```
src/app/            obrazovky (Expo Router)
  (tabs)/           Dnes, Plán, Cviky, Deník, Nastavení
  timer.tsx         časovač tréninku
  summary.tsx       uložení tréninku do deníku
  custom.tsx        vlastní časovač
  onboarding.tsx    úvodní nastavení
src/data/           cviky, tréninky, programy
src/lib/            store (stav + persistence), i18n, logika tréninku, jednotky, data
src/components/     UI komponenty, grafy
```

Nový cvik nebo program se přidává jen v `src/data/` – appka ho automaticky zobrazí. Po úpravě spusť `scripts/check-data.ts`.

## Další kroky (návrh)

1. **Denní check-in** – spánek, energie, nálada, jednoduché jídlo (bez počítání kalorií), propojené s tréninkem.
2. **GPS běh** (`expo-location`, poloha na pozadí) – trasa, mapa, mezičasy.
3. **Apple Health / Health Connect** – zápis tréninků.
4. Druhá vlna jazyků (ja, ko, tr, nl, uk, hi, id); překlady nechat zkontrolovat rodilými mluvčími.
5. Ikona, splash screen a texty pro App Store / Google Play.

## Jazyky

Čeština, norština a angličtina jsou přímo v `src/lib/i18n.ts` a v datech. Ostatní jazyky jsou v `src/locales/<kód>.ts`. Co chybí, se zobrazí anglicky. Nový jazyk: přidat kód do `ExtraLang` (`src/lib/types.ts`), soubor v `src/locales/`, záznam v `src/locales/index.ts` a v `LANG_NAMES` / `LANG_TAG`.

Obsah appky není lékařská rada – v Nastavení je upozornění.

© CIE AS
