# local-storage-schema.md

## Zweck
- Die Extension speichert den zuletzt bekannten Depotstand pro Depot in `localStorage`.
- Grundlage ist ein Key pro Depotnummer:
  - `finanzen_net_extension_<pkdepnr>`
  - Falls keine Depotnummer in der URL erkannt wird: `finanzen_net_extension_default`

## Aktuelles Format
- Der Wert unter dem Key ist ein JSON-Array.
- Jeder Eintrag repraesentiert den zuletzt bekannten Stand fuer `Gesamt` oder eine einzelne Position.
- Es wird nur noch dieses Schema unterstuetzt.
- Ein Snapshot wird nur erneuert, wenn der letzte gespeicherte Stand mindestens 2 Stunden alt ist.

## Eintragsstruktur
```json
{
  "key": "depot-entry:17752047",
  "name": "Gesamt oder Positionsname",
  "productIndex": 1,
  "currentValue": 123.45,
  "timestamp": "2026-03-15T21:00:00.000Z",
  "absolutePerformance": 456.78,
  "percentagePerformance": 3.21,
  "sinceBuyValue": 89.01
}
```

## Feldbedeutung
- `name`
  - Anzeige- und Fachname des Eintrags.
  - Fuer das Gesamtdepot wird aktuell `Gesamt` verwendet.
- `key`
  - Interner Persistenzschluessel fuer eindeutiges Matching.
  - Fuer das Gesamtdepot aktuell `portfolio:gesamt`.
  - Fuer einzelne Positionen bevorzugt `depot-entry:<pkdepdatennr>`.
  - Falls diese ID im DOM nicht verfuegbar ist, wird auf `isin:<isin>#<n>` und zuletzt `name:<name>#<n>` zurueckgefallen.
  - Die beiden Fallbacks gelten ausdruecklich als degradierter Modus und nicht als gleichwertige Identifikation.
- `productIndex`
  - Auftretensindex eines sichtbaren Namens innerhalb der aktuellen Tabelle.
  - Wird nur als Fallback und Zusatzkontext gespeichert.
- `currentValue`
  - Aktueller Kurs bzw. aktueller Einzelwert der Position aus der Tabelle.
  - Beim Eintrag `Gesamt` wird hier der aktuelle Gesamtwert des Depots gespeichert.
- `timestamp`
  - Zeitpunkt des letzten Speicherns in ISO-8601.
- `absolutePerformance`
  - Absoluter Performance-Wert der Position bzw. des Gesamtdepots zum letzten Abruf.
- `percentagePerformance`
  - Prozentuale Performance der Position bzw. des Gesamtdepots zum letzten Abruf.
- `sinceBuyValue`
  - Absolute Wertentwicklung seit Kauf fuer die Position.
  - Beim Eintrag `Gesamt` wird aktuell `0` gespeichert.

## Bekannte Schwaechen
- Fallbacks ueber `isin + Index` oder `name + Index` sind weniger robust als `pkdepdatennr`.
- Das Schema ist historisch gewachsen und noch nicht als bewusstes Datenmodell konsolidiert.

## Hinweis zu Alt-Daten
- Aeltere `localStorage`-Eintraege im frueheren Format werden nicht mehr ausgewertet.
- Nach dieser Umstellung kann der erste Aufruf der Depotseite deshalb wie ein Erstbesuch wirken.

## Snapshot-Policy
- Diffs werden immer gegen den zuletzt gespeicherten Snapshot berechnet.
- Ein neuer Snapshot wird nur geschrieben, wenn:
  - noch kein Eintrag existiert, oder
  - der letzte Eintrag mindestens 2 Stunden alt ist.
- Mehrfaches Reloaden innerhalb dieses Fensters ueberschreibt den Referenzstand deshalb nicht.

## Aktuelle Nutzung im Code
- Lesen und Schreiben:
  - `scripts/common.js`
- Gesamtdepot lesen und rendern:
  - `scripts/content.js`
- Positionsdaten lesen, speichern und Differenzen rendern:
  - `scripts/tableExpansion.js`

## Geplante Richtung
- Semantik zwischen Gesamtdepot und Einzelpositionen expliziter trennen.
- Fallback-Matching nur als Notbetrieb behandeln und im UI bzw. Logging klar kennzeichnen.
