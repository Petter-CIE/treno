# Treno – tréninkový parťák

Mobilní aplikace pro Android a iOS (Expo / React Native) pro plánování a vedení tréninku: kettlebell, posilovna, vlastní váha, kalistenika, kardio, běh a mobilita. Jazyky: čeština, norština (bokmål), angličtina.

> „Treno“ je pracovní název. Mění se v `app.json` (`name`, `slug`, `scheme`, `bundleIdentifier`, `package`) a v textech v `src/lib/i18n.ts`.

## Co appka umí (verze 1.0)

- **Úvodní nastavení** – disciplíny, vybavení (vč. vlastních kettlebellů), tréninkové dny, týdenní cíl.
- **Dnes** – dnešní trénink, týdenní přehled, série splněných týdnů, rychlý start (Tabata, EMOM, AMRAP, vlastní).
- **Plán** – týdenní kalendář, ruční přidávání tréninků, 10 hotových programů (posilovna, PPL, doma, první shyb, kalistenika, od nuly na 5 km, kettlebell, HIIT, mobilita).
- **Časovač** – série s pauzami, EMOM, AMRAP s počítáním kol, intervaly, běh/chůze, souvislé kardio. Hlasový trenér v jazyce appky, vibrace, displej nezhasne.
- **Knihovna cviků** – 63 cviků s technikou ve 3 jazycích, filtr a vyhledávání.
- **Deník** – zápis vah, vzdálenosti a tempa, RPE, poznámky, týdenní minuty, graf progresu u každého cviku.
- **Připomínky** – lokální notifikace v tréninkové dny.
- Data jsou jen v telefonu (AsyncStorage). Žádný účet, žádný server.

## Spuštění

```bash
npm install
npx expo start          # Expo Go / development build
npx tsc --noEmit        # typecheck
npx expo lint           # lint
npx tsx scripts/check-data.ts   # kontrola obsahu (cviky, tréninky, programy)
```

## Build a publikace

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform all --profile production
npx eas-cli@latest submit --platform ios
npx eas-cli@latest submit --platform android
```

Potřebuješ Apple Developer účet (99 USD/rok) a Google Play Console (jednorázově 25 USD). Bundle ID: `no.cie.treno`.

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

1. **Předplatné** (RevenueCat): zdarma základní časovač a deník, Premium programy + statistiky.
2. **Účty a synchronizace** (Supabase) – záloha dat a více zařízení.
3. **GPS běh** (`expo-location`, poloha na pozadí) – trasa, mapa, mezičasy.
4. **Apple Health / Health Connect** – zápis tréninků.
5. **Videa / animace cviků.**
6. Ikona, splash screen a texty pro App Store / Google Play.

Obsah appky není lékařská rada – v Nastavení je upozornění.

© CIE AS
