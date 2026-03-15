# AGENTS.md

## Projektkontext
- Dieses Repository enthaelt eine Chrome-Extension fuer `finanzen.net`.
- Ziel der Extension ist es, im virtuellen Depot nicht nur die Entwicklung seit Kauf oder seit Tagesbeginn zu zeigen, sondern die Veraenderung seit dem letzten eigenen Abruf.
- Die Extension erweitert dazu die Depotansicht direkt im Browser und speichert zuletzt bekannte Werte lokal, damit spaetere Aufrufe die Differenz berechnen koennen.

## Produktziel
- Nutzer sollen ihr Depot auf `finanzen.net` nicht taeglich kontrollieren muessen.
- Beim erneuten Oeffnen des Depots soll sichtbar sein, wie sich Gesamtdepot und einzelne Positionen seit dem letzten Besuch veraendert haben.
- Die Erweiterung soll moeglichst wenig Friktion erzeugen: Seite oeffnen, Werte sehen, kein manuelles Exportieren oder Nachpflegen.

## Aktueller technischer Stand
- Die Extension verwendet `manifest_version: 3`.
- Zentrale Logik liegt aktuell in:
  - `scripts/common.js`
  - `scripts/tableExpansion.js`
  - `scripts/content.js`
- Die Erweiterung arbeitet als Content Script direkt auf dem DOM der `finanzen.net`-Depotseite.
- Persistenz erfolgt derzeit ueber `localStorage` im Browser.
- Es gibt aktuell kein Build-System, kein Test-Setup und keine klar getrennte Architektur zwischen DOM-Auslese, Berechnung und Rendering.
- Im Repo liegen lokale HTML-Snapshots unter `localWebsiteFinanzenNet/`, die als Referenz fuer DOM-Strukturen nuetzlich sein koennen.

## Aktuelle Probleme und bekannte Risiken
- Die Codequalitaet ist verbesserungswuerdig; es gibt vermutlich Antipatterns und fragile DOM-Annahmen.
- Die Implementierung haengt stark an CSS-Klassen, Texten und Tabellenstrukturen von `finanzen.net`.
- Fehlerbehandlung ist nur begrenzt vorhanden. Fehlende DOM-Elemente koennen leicht zu Laufzeitfehlern fuehren.
- Datenmodell und Benennung sind inkonsistent und teils historisch gewachsen.
- `localStorage` ist fuer den ersten funktionierenden Stand ausreichend, aber fuer Robustheit, Migrationen und Mehrdepot-Szenarien nur begrenzt geeignet.
- Usability ist noch nicht abgeschlossen; insbesondere Transparenz, Aktualitaet und Bedienbarkeit muessen weiter verbessert werden.

## Arbeitsregeln fuer Codex
- Vor groesseren Aenderungen immer zuerst die betroffenen Dateien lesen und den Ist-Zustand verstehen.
- Aenderungen moeglichst klein und thematisch isoliert halten.
- Bestehendes Verhalten nicht stillschweigend umdeuten; bei Verhaltensaenderungen die Annahme explizit benennen.
- Keine unnoetigen Refactors quer durch das Repo, wenn der Task lokal loesbar ist.
- Direkte DOM-Zugriffe defensiv implementieren: auf `null` pruefen, fehlende Elemente abfangen, Fehlerszenarien mitdenken.
- Wenn DOM-Selektoren angepasst werden, immer die Auswirkung auf bestehende Depotansichten und lokale HTML-Snapshots pruefen.
- Persistierte Datenstrukturen in `localStorage` nicht leichtfertig brechen; Aenderungen am Schema nur mit klarer Migrationsidee.
- Debug-Logging nur gezielt einsetzen und bei produktionsreifen Aenderungen reduzieren oder zentralisieren.
- Vor dem Abschluss immer den Diff gegen offensichtliche Regressionen pruefen.

## Bevorzugte technische Richtung
- Logik sauber trennen in:
  - DOM lesen
  - Werte normalisieren und berechnen
  - Persistenz
  - Rendering in die bestehende Tabelle
- Wiederverwendbare Hilfsfunktionen in kleine, klar benannte Utilities verschieben statt weitere Ad-hoc-Logik in `content.js` zu stapeln.
- Magische Indizes in Tabellenzugriffen nach Moeglichkeit reduzieren oder zentral dokumentieren.
- Nutzerrelevante Anzeigen immer aus klaren, nachvollziehbaren Berechnungen ableiten.

## Definition of Done fuer Aenderungen
- Die Extension laedt weiterhin auf den vorgesehenen `finanzen.net`-Depotseiten.
- Die neuen oder geaenderten Werte werden ohne offensichtliche DOM-Fehler angezeigt.
- Bestehende Kernfunktion bleibt erhalten: Vergleich aktueller Depotdaten mit dem letzten gespeicherten Stand.
- Es gibt keine vermeidbaren neuen Konsolenfehler.
- Relevante Annahmen, Grenzen oder technische Schulden werden bei Bedarf kurz dokumentiert.

## Wichtige Dateien
- `manifest.json`: Chrome-Extension-Konfiguration und Einbindung der Content Scripts.
- `scripts/common.js`: Hilfsfunktionen fuer Parsing, Formatierung und Persistenz.
- `scripts/tableExpansion.js`: Erweiterung der Depot-Tabelle um zusaetzliche Spalten.
- `scripts/content.js`: Einstiegspunkt fuer DOM-Auslese, Speichern und Rendering im Seitenkopf.
- `localWebsiteFinanzenNet/`: Lokale Referenzseiten fuer Analyse und Reproduktion von DOM-Strukturen.

## Nicht-Ziele fuer spontane Codex-Sessions
- Kein ungeplanter Komplettumbau auf neues Framework.
- Keine vorschnelle Einfuehrung komplexer Infrastruktur ohne klaren Nutzen fuer das Produktziel.
- Keine kosmetischen Grossrefactors ohne direkten Mehrwert fuer Stabilitaet, Verstaendlichkeit oder Nutzerfunktion.
