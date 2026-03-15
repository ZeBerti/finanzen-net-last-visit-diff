# roadmap.md

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
- Die Zuordnung von Tabellenwerten zu konkreten Positionen ist teilweise fragil.
- Insbesondere Sortierung und Wiedererkennung einzelner Zeilen sind schwierig, wenn keine stabile ID vorhanden ist und Name plus sichtbare Werte nicht eindeutig genug sind.
- Dieses Problem ist bekannt, aber fuer die Planung zunaechst als technisches Risiko erfasst. Die genaue Loesung wird separat validiert.

## Phase 1: Stabilisieren
- Content-Script-Ausfuehrung robuster machen:
  - defensive DOM-Zugriffe
  - saubere Abbruchpfade bei fehlenden Elementen
  - weniger Annahmen ueber sofort verfuegbare DOM-Strukturen
- Offensichtliche Laufzeitfehler und Null-Zugriffe beseitigen.
- Logging aufraeumen:
  - irrelevante Debug-Ausgaben reduzieren
  - wichtige Fehlersituationen klarer kennzeichnen
- Lokale Referenzseiten unter `localWebsiteFinanzenNet/` gezielt fuer Reproduktion und Regressionen nutzen.

## Phase 2: Datenmodell und Persistenz haerten
- Aktuelles `localStorage`-Schema dokumentieren.
- Inkonsistente Feldnamen und historische Altlasten identifizieren.
- Berechnungen fuer:
  - aktueller Stand
  - letzter Stand
  - Differenz seit letztem Besuch
  zentralisieren und vereinheitlichen.
- Pruefen, wie mehrere gleichnamige Positionen oder mehrdeutige Eintraege sauberer behandelt werden koennen.
- Das Sortierungs- und Zuordnungsproblem systematisch untersuchen und moegliche Schluesselstrategien festhalten.

## Phase 3: Codequalitaet verbessern
- Verantwortlichkeiten sauber trennen:
  - DOM lesen
  - Daten parsen
  - Daten speichern/laden
  - Differenzen berechnen
  - UI rendern
- Fragile Tabellenindizes reduzieren oder an zentraler Stelle dokumentieren.
- Doppelte oder schwer benannte Logik bereinigen.
- Kleine, leicht testbare Hilfsfunktionen bevorzugen statt weiterer monolithischer Content-Script-Logik.

## Phase 4: Usability verbessern
- Anzeigen fuer "seit letztem Besuch" besser verstaendlich machen:
  - klare Beschriftung
  - sinnvolle Tooltips
  - nachvollziehbarer Zeitbezug
- Sichtbarkeit verbessern, ohne die bestehende Depotansicht zu ueberladen.
- Randfaelle besser behandeln:
  - erster Besuch ohne gespeicherte Daten
  - unvollstaendige Tabellenzeilen
  - negative Werte
  - Sonderzeilen oder Warnhinweise in der Tabelle

## Phase 5: Produktisierung vorbereiten
- Manifest, Rechte und Beschreibung fuer eine spaetere Veroeffentlichung pruefen.
- Optionen, Versionswechsel und Datenmigration sauberer aufsetzen.
- Manuelle Testcheckliste fuer mehrere Depotzustaende anlegen.
- UI und Copy so weit saubermachen, dass eine externe Nutzung realistisch wird.

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
- DOM-Zugriffe in `content.js` und `tableExpansion.js` gegen fehlende Elemente absichern.
- Aktuelles Datenmodell aus `localStorage` explizit dokumentieren.
- Relevante Berechnungen fuer Differenzen an einer Stelle zusammenziehen.
- Das Zuordnungsproblem bei Sortierung und mehrfach vorkommenden Namen mit realen Beispielen analysieren.
