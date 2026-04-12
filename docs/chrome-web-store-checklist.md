# Chrome Web Store Checklist

Status: April 12, 2026

Diese Checkliste fasst zusammen, was fuer eine erste Chrome-Web-Store-Veroeffentlichung dieses Projekts noch noetig ist.

## Bereits vorhanden

- Manifest V3
- Icons bis `128x128`
- Projekt-README
- Privacy Policy
- GitHub-Repository
- Funktionierende Extension mit lokaler Testabdeckung

## Noch noetig vor einer Einreichung

### 1. Store-Metadaten vorbereiten

- kurzer Beschreibungstext
- ausfuehrliche Beschreibung
- Kategorie waehlen
- Screenshots erstellen

Hinweis:
- Laut Chrome Web Store Listing Requirements wird eine Erweiterung ohne Beschreibung, Icon oder Screenshot abgelehnt.

### 2. Privacy-Angaben sauber machen

- Privacy Policy im Developer Dashboard verlinken
- Privacy-Formular im Dashboard konsistent zur echten Extension ausfuellen

Fuer dieses Projekt ist das relevant, weil die Extension sichtbare Depotdaten liest und Snapshot-Daten lokal speichert.

### 3. Manifest fuer Store-Betrieb bereinigen

Erledigt fuer den aktuellen Release-Stand:

- Entwicklungs-Matches wurden entfernt
- im Manifest bleiben nur die echten Zielseiten uebrig:

- `https://www.finanzen.net/depot/*`
- `https://finanzen.net/depot/*`

### 4. Screenshots vorbereiten

Sinnvolle Screenshots fuer den Store:

- Depotseite mit Summary oben
- Tabelle mit Plugin-Spalte
- Popup mit Snapshot-Intervall
- Beispiel fuer Sortierung nach `± zuletzt`

### 5. Upload-Paket bauen

- sauberen Repo-Stand sicherstellen
- ZIP aus dem Projekt fuer die Store-Einreichung erstellen

## Offene Entscheidung

Vor einer Store-Einreichung muessen wir entscheiden, ob wir:

- eine reine Store-Version bauen
- oder Entwicklungs-Matches und Testmodus im Hauptzweig behalten und erst fuer den Release-Stand herausnehmen

Empfehlung:
- fuer die erste Einreichung einen klaren Release-Stand ohne Test-Matches verwenden

## Quellen

- Chrome Web Store Program Policies:
  - https://developer.chrome.com/docs/webstore/program-policies/policies
- Listing Requirements:
  - https://developer.chrome.com/docs/webstore/program-policies/listing-requirements
- Privacy Policies:
  - https://developer.chrome.com/docs/webstore/program-policies/privacy
- Limited Use:
  - https://developer.chrome.com/docs/webstore/program-policies/limited-use
- Supplying Images:
  - https://developer.chrome.com/webstore/images
