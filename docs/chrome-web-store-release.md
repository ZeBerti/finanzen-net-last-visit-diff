# Chrome Web Store Release Prep

## Ziel

Diese Datei beschreibt den praktischen Ablauf fuer eine erste Chrome-Web-Store-Einreichung.

## Vor dem Packen

Pruefen:

- `manifest.json` enthaelt nur Release-Matches fuer `finanzen.net/depot/*`
- Version ist erhoeht
- Worktree ist sauber
- README, Privacy Policy und Store-Listing-Entwurf sind aktuell

## Upload-Datei vorbereiten

Fuer den Chrome Web Store wird ein ZIP der Extension benoetigt.

Im Projekt gibt es dafuer jetzt einen Build-Schritt:

```bash
npm run build:release
```

Danach liegt das Paket unter:

- `dist/finanzen-net-last-visit-diff-chrome.zip`
- `dist/finanzen-net-last-visit-diff-firefox.zip`

Der ZIP-Inhalt sollte mindestens enthalten:

- `manifest.json`
- `options.html`
- `popup.js`
- `scripts/`
- `icons/`

Zusaetzliche Projektdateien wie `tests/`, `docs/`, `.git/` oder lokale Snapshots muessen fuer den Upload nicht mit in das Paket.

## Praktische Release-Empfehlung

Fuer eine saubere Store-Einreichung ist ein kleines Release-Paket sinnvoll, das nur die wirklich benoetigten Laufzeitdateien enthaelt.

Empfohlene Release-Dateien:

- `manifest.json`
- `options.html`
- `popup.js`
- `scripts/common.js`
- `scripts/content.js`
- `scripts/tableExpansion.js`
- `icons/icon16.png`
- `icons/icon32.png`
- `icons/icon48.png`
- `icons/icon128.png`

Diese Auswahl wird vom Build-Script bereits so zusammengestellt.

## Dashboard-Eingaben

Im Chrome Web Store Developer Dashboard werden mindestens benoetigt:

- Name
- kurze Beschreibung
- ausfuehrliche Beschreibung
- Kategorie
- Screenshots
- Privacy Policy Link

Aktuelle Privacy-Policy-URL:

- https://zeberti.github.io/finanzen-net-last-visit-diff/privacy-policy.html

## Nach dem Upload

Pruefen:

- Extension laeuft auf echten `finanzen.net`-Depotseiten
- Popup funktioniert
- Sortierung funktioniert
- keine unnötigen Berechtigungen
- keine Entwicklungs-Matches mehr im Manifest

## Offener naechster Schritt

Vor der echten Einreichung brauchen wir noch:

- verbessertes Screenshot-Set fuer den Store
