# Vydání – checklist

Stav k 5. 11. 2026. ✅ hotovo · ⬜ zbývá (kdo)

## 1. Název appky ✅
**Varde Fitness** (norsky *varde* = kamenná mohyla, která ukazuje cestu). „Treno“ bylo v App Store obsazené.
- iOS bundle ID / Android package: `no.cie.varde`, Expo slug `varde-fitness`.
- ⬜ Při zakládání v App Store Connect ověřit, že je název volný (rezervuje se se založením appky).
- GitHub repo se pořád jmenuje `treno` – lze přejmenovat v nastavení repa na GitHubu (odkazy se samy přesměrují).

## 2. Obsah appky ✅
- ✅ 63 cviků s animacemi, 29 tréninků, 10 programů, 12 jazyků
- ✅ Severský vzhled (fjord / polární záře), ikona s vardem, adaptivní ikona Android, splash screen (`design/icon/make-icons.py`)
- ✅ `expo-doctor` 20/20, typecheck, lint, kontrola obsahu i překladů
- ✅ Podpůrná stránka + zásady soukromí: https://cieas.no/varde/ (PayPal hotový, ⬜ Vipps zítra) – ⬜ nahrát `web/varde/index.html` do nové složky `varde` na cieas.no

## 3. Test na telefonu ⬜ (Petter)
Nic z toho zatím neběželo na skutečném zařízení.
1. `git clone https://github.com/Petter-CIE/treno && cd treno && npm install && npx expo start`
2. Naskenovat QR v aplikaci **Expo Go** (iPhone i Android).
3. Projít:
   - [ ] úvodní nastavení (disciplíny, vybavení, dny)
   - [ ] spustit trénink: **hlas** v češtině/norštině, odpočet 3-2-1, **vibrace**, displej nezhasne
   - [ ] pauza / přeskočit / zpět, ukončit a uložit
   - [ ] uložení do deníku, graf progresu
   - [ ] **připomínky**: zapnout v Nastavení, povolit notifikace, ověřit, že přijde (např. nastavit čas za 2 minuty)
   - [ ] změna jazyka a jednotek
   - [ ] tlačítko „Podpoř Varde Fitness“ otevře cieas.no/varde ve správném jazyce
   - [ ] appku zavřít a znovu otevřít – data zůstanou

## 4. Expo / EAS ⬜ (Petter – vyžaduje přihlášení)
```bash
npx eas-cli@latest login          # účet cie-as
npx eas-cli@latest init           # vytvoří projekt a doplní projectId do app.json
npx eas-cli@latest build --platform all --profile production
```
`eas.json` je připravený (profily `preview` = APK pro testování, `production` = obchody, verze se zvyšuje automaticky).

## 5. App Store Connect ⬜ (Petter)
1. My Apps → **+ New App**: platforma iOS, název (viz bod 1), jazyk English (U.S.), bundle ID `no.cie.varde`, SKU např. `varde-ios`.
2. Texty a údaje: `store/listing.md` (EN, NO, CZ – ostatní jazyky lze doplnit).
3. Screenshoty 6.9″: `store/screenshots/{en,nb,cs}_1–6.png` (1320 × 2868).
4. App Privacy: **Data Not Collected**.
5. Věk 4+, cena Free, bez nákupů v aplikaci.
6. Review Notes: text v `store/listing.md`.
7. `npx eas-cli@latest submit --platform ios` → TestFlight → odeslat ke schválení.

## 6. Google Play Console ⬜ (Petter)
1. **Create app**: název, výchozí jazyk English, App, Free.
2. Store listing: krátký a celý popis z `store/listing.md`, ikona 512 × 512 (`assets/icon.png` zmenšit), feature graphic 1024 × 500 (⬜ udělám), screenshoty telefonu (`store/screenshots`).
3. App content: Privacy policy `https://cieas.no/varde/#privacy`, Ads: No, Data safety: no data collected, Target audience 18+, Health: fitness, není zdravotnický prostředek.
4. `npx eas-cli@latest submit --platform android` → Internal testing → Production.

## 7. Po vydání
- Vipps na podpůrné stránce.
- Denní check-in (spánek, energie, nálada, jednoduché jídlo).
- Kontrola překladů rodilými mluvčími (hlavně de, es, fr).
- Druhá vlna jazyků.
