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
- Das Snapshot-Intervall ist ueber das Popup konfigurierbar.
- Ein Snapshot wird nur erneuert, wenn:
  - das konfigurierte Intervall abgelaufen ist, und
  - sich die gespeicherten Werte gegenueber dem aktuellen Stand geaendert haben.

## Eintragsstruktur
```json
{
  "key": "depot-entry:17752047",
  "name": "Gesamt oder Positionsname",
  "currentValue": 123.45,
  "timestamp": "2026-03-15T21:00:00.000Z",
  "absolutePerformance": 456.78,
  "percentagePerformance": 3.21,
  "sinceBuyValue": 89.01
}
```

## Feldbedeutung
- `key`
  - Interner Persistenzschluessel fuer eindeutiges Matching.
  - Fuer das Gesamtdepot aktuell `portfolio:gesamt`.
  - Fuer einzelne Positionen bevorzugt `depot-entry:<pkdepdatennr>`.
  - Falls diese ID im DOM nicht verfuegbar ist, wird auf `isin:<isin>#<n>` und zuletzt `name:<name>#<n>` zurueckgefallen.
  - Die beiden Fallbacks gelten ausdruecklich als degradierter Modus und nicht als gleichwertige Identifikation.
- `currentValue`
  - Aktueller Kurs bzw. aktueller Einzelwert der Position aus der Tabelle.
  - Beim Eintrag `Gesamt` wird hier der aktuelle Gesamtwert des Depots gespeichert.
- `timestamp`
  - Zeitpunkt des letzten Speicherns in ISO-8601.
- `absolutePerformance`
  - Absoluter Performance-Wert der Position bzw. des Gesamtdepots zum letzten Abruf.
  - Wird aktuell vor allem fuer den Header des Gesamtdepots benoetigt.
- `percentagePerformance`
  - Prozentuale Performance der Position bzw. des Gesamtdepots zum letzten Abruf.
- `sinceBuyValue`
  - Absolute Wertentwicklung seit Kauf fuer die Position.
  - Beim Eintrag `Gesamt` wird aktuell `0` gespeichert.
- `name`
  - Nur Metadatum fuer Lesbarkeit und Debugging.
  - Fuer die Berechnung der Diffs nicht erforderlich.

## Bekannte Schwaechen
- Fallbacks ueber `isin + Index` oder `name + Index` sind weniger robust als `pkdepdatennr`.
- Das Schema enthaelt noch Metadaten (`name`), die fachlich nicht zwingend fuer die Berechnung noetig sind.
- `absolutePerformance` ist derzeit nur teilweise fachlich begruendet und sollte bei einer spaeteren Schema-Bereinigung gezielt neu bewertet werden.

## Hinweis zu Alt-Daten
- Aeltere `localStorage`-Eintraege im frueheren Format werden nicht mehr ausgewertet.
- Nach dieser Umstellung kann der erste Aufruf der Depotseite deshalb wie ein Erstbesuch wirken.

## Snapshot-Policy
- Diffs werden immer gegen den zuletzt gespeicherten Snapshot berechnet.
- Ein neuer Snapshot wird nur geschrieben, wenn:
  - noch kein Eintrag existiert, oder
  - das konfigurierte Intervall abgelaufen ist und sich Werte geaendert haben.
- Mehrfaches Reloaden ohne Wertaenderung ueberschreibt den Referenzstand deshalb nicht.
- Fehlende Positions-Snapshots duerfen trotzdem initial angelegt werden, auch wenn der Portfolio-Snapshot selbst nicht erneuert wird.

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
- Persistiertes Schema weiter verschlanken, insbesondere `name`.
