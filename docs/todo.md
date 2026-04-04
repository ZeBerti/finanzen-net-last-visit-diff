# TODO

## Produkt
- Snapshot-Intervall im Popup konfigurierbar machen statt fest auf 2 Stunden.
- Letzten Snapshot-Zeitpunkt im Popup zusaetzlich zum Snapshot-Alter anzeigen.
- Sortierung der Tabelle nach `± zuletzt` pruefen und bei Bedarf ergaenzen.
- Visuelles Highlight fuer starke Aenderungen seit dem letzten Snapshot pruefen.

## UX
- Begriffe in Tooltip und Header weiter schaerfen, falls `Performance` und `Wertentwicklung gesamt` noch missverstaendlich sind.
- Verhalten bei fehlenden Kursdaten weiter beobachten und bei Bedarf besser kennzeichnen.
- Popup um klarere Rueckmeldungen nach `Snapshot jetzt aktualisieren` und `Snapshots zuruecksetzen` erweitern.

## Technik
- `content.js` weiter aufteilen: Header-Rendering, Snapshot-Logik und Message-Handling staerker trennen.
- Diff-Zellen-Erzeugung in `tableExpansion.js` weiter vereinheitlichen.
- Reine Helfer wie `calculateDiffValues`, `formatPercent`, `formatSnapshotAge` und `formatPercentagePoints` mit kleinen Tests absichern.
- Mittelfristig pruefen, ob `localStorage` durch `chrome.storage.local` ersetzt werden soll.

## Doku
- Popup-Snapshot-Steuerung in `local-storage-schema.md` dokumentieren.
- Tooltip-Logik und aktuelle Snapshot-Policy in den Doku-Dateien aktualisieren.
