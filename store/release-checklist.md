# Vydání – checklist

Stav k 7. 11. 2026. ✅ hotovo · ⬜ zbývá (kdo)

## 1. Název appky ✅
**Varde Fitness** (norsky *varde* = kamenná mohyla, která ukazuje cestu). „Treno“ bylo v App Store obsazené.
- iOS bundle ID / Android package: `no.cie.varde`, Expo slug `varde-fitness`.
- ⬜ Při zakládání v App Store Connect ověřit, že je název volný (rezervuje se se založením appky).
- GitHub repo se pořád jmenuje `treno` – lze přejmenovat v nastavení repa na GitHubu (odkazy se samy přesměrují).

## 2. Obsah appky ✅
- ✅ 70 cviků s animacemi, 31 tréninků, 10 programů, 12 jazyků
- ✅ Severský vzhled (fjord / polární záře), ikona s vardem, adaptivní ikona Android, splash screen (`design/icon/make-icons.py`)
- ✅ `expo-doctor` 20/20, typecheck, lint, kontrola obsahu i překladů
- ✅ Podpůrná stránka + zásady soukromí: https://cieas.no/varde/ (PayPal hotový, ⬜ Vipps zítra) – ⬜ nahrát `web/varde/index.html` do nové složky `varde` na cieas.no

## 2b. Účet a záloha ✅ / ⬜ (Petter – Supabase dashboard)
✅ Hotovo: databáze, zabezpečení (každý vidí jen svá data – otestováno), smazání účtu, přihlašovací obrazovka v Nastavení ve 12 jazycích, stránka soukromí s oddílem „Smazání účtu“.
⬜ **Šablona e-mailu s kódem** – supabase.com → projekt *varde-fitness* → Authentication → Emails → Templates → **Magic Link**:
   - Subject: `Varde Fitness – your code {{ .Token }}`
   - Body: `<h2>Varde Fitness</h2><p>Your sign-in code:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">{{ .Token }}</p><p>The code is valid for 1 hour. If you did not ask for it, ignore this email.</p>`
   - Bez `{{ .Token }}` by přišel jen odkaz, který v appce nefunguje.
⬜ **Vlastní odesílání e-mailů (SMTP)** – vestavěný e-mail Supabase pošle jen pár e-mailů za hodinu a jen pro testování. Pro ostré vydání: zdarma účet na **Brevo** (brevo.com, 300 e-mailů/den) → ověřit doménu cieas.no (DNS záznamy) → SMTP klíč → Supabase: Authentication → Emails → SMTP Settings: host `smtp-relay.brevo.com`, port `587`, odesílatel `varde@cieas.no`, jméno „Varde Fitness“.
⬜ Authentication → Sign In / Providers → Email: nechat zapnuté, **Confirm email** zapnuté (kód to splní).
⬜ ⬆️ Znovu nahrát `web/varde/index.html` do složky `varde` na cieas.no (nová stránka soukromí + smazání účtu).

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
   - [ ] Nastavení → Účet a záloha: zadat e-mail, přijde kód, přihlásit → „Poslední záloha“
   - [ ] odinstalovat, nainstalovat, přihlásit stejným e-mailem → deník a plán jsou zpátky
   - [ ] Smazat účet → potvrzení

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
4. App Privacy: podle `store/listing.md` (e-mail, fitness, obsah – jen App Functionality, bez sledování). Do Review Notes stačí text z listing.md – appka jde používat bez účtu.
5. Věk 4+, cena Free, bez nákupů v aplikaci.
6. Review Notes: text v `store/listing.md`.
7. `npx eas-cli@latest submit --platform ios` → TestFlight → odeslat ke schválení.

## 6. Google Play Console ⬜ (Petter)
1. **Create app**: název, výchozí jazyk English, App, Free.
2. Store listing: krátký a celý popis z `store/listing.md`, ikona 512 × 512 (`assets/icon.png` zmenšit), feature graphic 1024 × 500 (⬜ udělám), screenshoty telefonu (`store/screenshots`).
3. App content: Privacy policy `https://cieas.no/varde/#privacy`, Ads: No, Data safety: podle `store/listing.md` (nepovinný účet, Delete account URL `https://cieas.no/varde/#delete-account`), Target audience 18+, Health: fitness, není zdravotnický prostředek.
4. `npx eas-cli@latest submit --platform android` → Internal testing → Production.

## 7. Po vydání
- Vipps na podpůrné stránce.
- Denní check-in (spánek, energie, nálada, jednoduché jídlo).
- Kontrola překladů rodilými mluvčími (hlavně de, es, fr).
- Druhá vlna jazyků.
