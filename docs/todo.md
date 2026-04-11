# TODO

## UX
- Begriffe in Tooltip und Header weiter schaerfen, falls `Kursdifferenz`, `Prozentdifferenz` und `Gesamtdifferenz` noch missverstaendlich sind.
- Verhalten bei fehlenden Kursdaten weiter beobachten und bei Bedarf besser kennzeichnen.

## Projekt
- Extension fuer den Chrome Web Store vorbereiten und veroeffentlichen.

## Technik
- `content.js` weiter aufteilen: Header-Rendering, Snapshot-Logik und Message-Handling staerker trennen.
- Diff-Zellen-Erzeugung in `tableExpansion.js` weiter vereinheitlichen.
- Reine Helfer wie `calculateDiffValues`, `formatPercent` und `formatSnapshotTimestamp` mit kleinen Tests absichern.
- Persistiertes Schema verschlanken: pruefen, ob `name` spaeter ebenfalls aus dem gespeicherten Format entfernt werden kann.
- Mittelfristig pruefen, ob `localStorage` durch `chrome.storage.local` ersetzt werden soll.
