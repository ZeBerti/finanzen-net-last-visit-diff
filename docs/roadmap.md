# Roadmap

## Zielbild
- Die Extension soll fuer das virtuelle Depot auf `finanzen.net` verlaesslich anzeigen, wie sich Gesamtdepot und Einzelpositionen seit dem letzten Besuch veraendert haben.
- Kurzfristige Prioritaet ist nicht Feature-Breite, sondern Stabilitaet, Nachvollziehbarkeit und eine besser wartbare Codebasis.
- Veroeffentlichung im Chrome Web Store ist eine moegliche spaetere Option, aber aktuell kein unmittelbares Ziel.

## Leitlinien
- Erst bestehende Funktion robust machen, dann erweitern.
- Architektur nur so weit umbauen, wie es Stabilitaet und Wartbarkeit messbar verbessert.
- DOM-Abhaengigkeiten bewusst kapseln, weil `finanzen.net` keine stabile Integrationsschnittstelle bietet.
- Solange das Plugin nur fuer den Eigengebrauch gedacht ist, darf pragmatisch gearbeitet werden, aber nicht chaotisch.

## Bekannte Unsicherheiten
- Die Zuordnung von Tabellenwerten zu konkreten Positionen ist ueber `pkdepdatennr` inzwischen deutlich robuster.
- Fragil bleibt der degradierte Fallback, falls diese ID im DOM einmal nicht verfuegbar sein sollte.
- Auch kuenftige Layout-Aenderungen auf `finanzen.net` bleiben ein reales Risiko fuer Parsing und Rendering.

## Phase 1: Stabilisieren
- Defensive DOM-Zugriffe und saubere Abbruchpfade sind eingefuehrt.
- Offensichtliche Laufzeitfehler, Null-Zugriffe und ueberlaute Logs wurden reduziert.
- Lokale Referenzseiten unter `localWebsiteFinanzenNet/` werden bereits fuer Reproduktion und Regressionen genutzt.
- Offene Restarbeit:
  - weitere DOM-Annahmen schrittweise abbauen
  - Sonderfaelle mit fehlenden Kursdaten weiter beobachten

## Phase 2: Datenmodell und Persistenz haerten
- Das aktuelle `localStorage`-Schema ist dokumentiert und auf ein kanonisches Format reduziert.
- Legacy-Felder und `productIndex` wurden aus der Persistenz entfernt.
- Snapshot-Policy ist eingefuehrt:
  - Intervall konfigurierbar
  - nur speichern bei echtem Aenderungsbedarf
  - fehlende Positions-Snapshots duerfen initial angelegt werden
- Mehrfach vorkommende Positionen werden primaer ueber `pkdepdatennr` erkannt.
- Offene Restarbeit:
  - mittelfristig `localStorage` gegen `chrome.storage.local` pruefen
  - `name` spaeter eventuell ebenfalls aus dem Persistenzschema entfernen

## Phase 3: Codequalitaet verbessern
- Verantwortlichkeiten sauber trennen:
  - DOM lesen
  - Daten parsen
  - Daten speichern/laden
  - Differenzen berechnen
  - UI rendern
- Header-basierte Spaltenerkennung ersetzt bereits einen Teil der frueheren magischen Tabellenindizes.
- Parsing und Sortierung wurden bereits in kleinere Helfer zerlegt.
- Offene Restarbeit:
  - `content.js` weiter aufteilen
  - Diff-Zellen-Erzeugung in `tableExpansion.js` weiter vereinheitlichen
  - kleine Hilfsfunktionen testseitig breiter absichern

## Phase 4: Usability verbessern
- Header, Tooltip und Zusatzspalten wurden bereits sprachlich und visuell angenaehert.
- Popup bietet inzwischen Snapshot-Intervall und Testmodus fuer simulierte Kursbewegungen.
- Die drei Plugin-Subspalten sind clientseitig sortierbar:
  - `± zuletzt`
  - `% zuletzt`
  - `∑ zuletzt`
- Randfaelle wie Erstbesuch, Warnzeilen ohne Kursdaten und fehlende Positions-Snapshots werden bereits abgefangen.
- Offene Restarbeit:
  - Copy weiter schaerfen
  - fehlende Kursdaten weiter beobachten

## Phase 5: Produktisierung vorbereiten
- GitHub-Repository ist angelegt und der aktuelle Stand ist bereits veroeffentlicht.
- Chrome-Web-Store-Vorbereitung bleibt als naechster groesserer Produktisierungsschritt offen.
- Manifest, Rechte, Beschreibung und Testcheckliste sollten vor einer Veroeffentlichung gezielt gehaertet werden.
- UI und Copy muessen fuer externe Nutzer noch etwas sauberer und selbsterklaerender werden.

## Laufende Arbeitsweise
- Neue Arbeit bevorzugt in kleinen, isolierten Schritten.
- Vor jeder groesseren Aenderung zunaechst Ist-Zustand und Risiken dokumentieren.
- Nach jeder funktionalen Aenderung kurz pruefen:
  - laeuft das Script noch
  - werden Werte korrekt gelesen
  - werden Werte korrekt gespeichert
  - wird die Tabelle weiterhin sinnvoll erweitert
- Refactors nur dann priorisieren, wenn sie konkrete Fehler oder Wartungsprobleme loesen.

## Naechste sinnvolle Tasks
- `content.js` weiter in kleinere Verantwortungsbereiche zerlegen.
- Diff-Zellen-Erzeugung in `tableExpansion.js` weiter vereinheitlichen.
- Kleine Helper-Tests fuer Formatierung und Snapshot-Logik ausbauen.
- Chrome-Web-Store-Vorbereitung und Release-Checkliste planen.
