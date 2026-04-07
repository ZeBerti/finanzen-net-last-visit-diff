# TODO

## Produkt
- Sortierung der Tabelle nach `± zuletzt` pruefen und bei Bedarf ergaenzen.
- Weitere clientseitige Sortierung pruefen: `% zuletzt` und ggf. `W.-entw. seit letz. Bes.` ebenfalls sortierbar machen, sofern der Aufwand ueberschaubar bleibt.
- Visuelles Highlight fuer starke Aenderungen seit dem letzten Snapshot pruefen.
- Pruefen, ob unsere Plugin-Spalte subtil optisch hervorgehoben werden soll, damit Zusatzwerte gegenueber Originalwerten erkennbar bleiben.

## UX
- Begriffe in Tooltip und Header weiter schaerfen, falls `Performance` und `Wertentwicklung gesamt` noch missverstaendlich sind.
- Verhalten bei fehlenden Kursdaten weiter beobachten und bei Bedarf besser kennzeichnen.
- Popup um klarere Rueckmeldungen nach `Snapshot jetzt aktualisieren` und `Snapshots zuruecksetzen` erweitern.

## Technik
- `content.js` weiter aufteilen: Header-Rendering, Snapshot-Logik und Message-Handling staerker trennen.
- Diff-Zellen-Erzeugung in `tableExpansion.js` weiter vereinheitlichen.
- Reine Helfer wie `calculateDiffValues`, `formatPercent`, `formatSnapshotTimestamp` und `formatPercentagePoints` mit kleinen Tests absichern.
- Persistiertes Schema verschlanken: pruefen, ob `name` spaeter ebenfalls aus dem gespeicherten Format entfernt werden kann.
- Mittelfristig pruefen, ob `localStorage` durch `chrome.storage.local` ersetzt werden soll.

## Doku
- Tooltip-Logik und aktuelle Snapshot-Policy in den Doku-Dateien aktualisieren.
