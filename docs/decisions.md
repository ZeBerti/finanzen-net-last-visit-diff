# Decisions

## Zweck
- Dieses Dokument haelt Architektur-, Produkt- und Umsetzungsentscheidungen fuer die Chrome-Extension fest.
- Entscheidungen sollen hier kurz dokumentiert werden, damit kuenftige Aenderungen nachvollziehbar bleiben und nicht nur implizit im Code entstehen.

## Format
- Jede Entscheidung bekommt:
  - Datum
  - Status
  - Kontext
  - Entscheidung
  - Konsequenzen
- Moegliche Statuswerte:
  - accepted
  - proposed
  - superseded
  - rejected

## DEC-001: Chrome-Extension als Integrationsform
- Datum: 2026-03-15
- Status: accepted
- Kontext:
  - Das Ziel ist, die bestehende Depotansicht von `finanzen.net` direkt beim normalen Nutzen der Website zu erweitern.
  - Nutzer sollen keine separate Anwendung oder manuelle Exporte benoetigen.
- Entscheidung:
  - Die Funktion wird als Chrome-Extension umgesetzt, die direkt auf der Seite laeuft.
- Konsequenzen:
  - Die Integration ist nah am realen Nutzungskontext.
  - Die Implementierung haengt von DOM-Strukturen und Seitenveraenderungen auf `finanzen.net` ab.
  - Browser-spezifische Grenzen und Manifest-Anforderungen muessen beachtet werden.

## DEC-002: Vergleich mit dem letzten bekannten Stand statt Tages- oder Kaufbasis
- Datum: 2026-03-15
- Status: accepted
- Kontext:
  - `finanzen.net` zeigt bereits Entwicklungen seit Kauf oder fuer den laufenden Tag.
  - Es fehlt die Sicht darauf, was sich seit dem letzten persoenlichen Abruf veraendert hat.
- Entscheidung:
  - Die Extension fokussiert auf die Differenz zwischen aktuellem Zustand und zuletzt gespeichertem Zustand.
- Konsequenzen:
  - Die Extension braucht lokale Persistenz.
  - Der Wert ist stark an das eigene Nutzungsverhalten gekoppelt.
  - Randfaelle wie Erstbesuch, veraltete Daten oder Depotaenderungen muessen sauber behandelt werden.

## DEC-003: Lokale Persistenz ueber `localStorage` fuer den aktuellen Stand
- Datum: 2026-03-15
- Status: accepted
- Kontext:
  - Es existiert bereits eine funktionierende Implementierung, die Werte lokal im Browser speichert.
  - Fuer den aktuellen Eigengebrauch ist eine einfache, sofort verfuegbare Loesung ausreichend.
- Entscheidung:
  - Der aktuelle Stand bleibt vorerst bei `localStorage`.
- Konsequenzen:
  - Die Loesung ist einfach und ohne weitere Infrastruktur nutzbar.
  - Datenmodell, Migration und Robustheit sind begrenzt.
  - Eine spaetere Umstellung auf `chrome.storage` oder ein saubereres Persistenzmodell bleibt offen.

## DEC-004: Stabilitaet und Codequalitaet vor neuen Features
- Datum: 2026-03-15
- Status: accepted
- Kontext:
  - Es gibt bereits einen funktionierenden Stand, aber die Codequalitaet ist verbesserungswuerdig.
  - Es bestehen Usability-Huerden, Antipatterns und fragile DOM-Annahmen.
  - Das Plugin ist aktuell primaer fuer den Eigengebrauch gedacht.
- Entscheidung:
  - Kurzfristig werden Stabilitaet, Robustheit und Codequalitaet hoeher priorisiert als neue Features oder Store-Vorbereitung.
- Konsequenzen:
  - Fruehe Arbeit konzentriert sich auf defensive DOM-Verarbeitung, nachvollziehbare Berechnungen und klarere Struktur.
  - Produktisierung wird erst spaeter relevant.

## DEC-005: DOM-basierte Integration trotz fragiler Selektoren
- Datum: 2026-03-15
- Status: accepted
- Kontext:
  - `finanzen.net` bietet fuer diesen Anwendungsfall keine stabile, offizielle Integrationsschnittstelle.
  - Die vorhandene Extension liest und erweitert die Tabelle direkt im DOM.
- Entscheidung:
  - Die Erweiterung bleibt zunaechst DOM-basiert, auch wenn Selektoren und Tabellenindizes fragil sind.
- Konsequenzen:
  - DOM-Zugriffe muessen besonders defensiv sein.
  - Aenderungen an der Seite koennen die Extension brechen.
  - Die Abhaengigkeit von Klassen, Texten und Tabellenstruktur muss bewusst dokumentiert und schrittweise entkoppelt werden.

## DEC-006: Depotpositionen werden primaer ueber `pkdepdatennr` identifiziert
- Datum: 2026-04-06
- Status: accepted
- Kontext:
  - Einzelne Tabellenzeilen koennen mehrfach denselben Namen oder dieselbe ISIN enthalten.
  - Das Matching ueber Name oder sichtbare Werte fuehrte bei mehrfach vorkommenden Positionen zu falschen Diffs.
- Entscheidung:
  - Positionen werden primaer ueber `pkdepdatennr` aus dem DOM identifiziert.
  - Fallbacks ueber `isin + Index` oder `name + Index` bleiben nur als degradierter Modus erhalten.
- Konsequenzen:
  - Mehrfach vorkommende Positionen koennen robust getrennt verglichen werden.
  - Der degradierte Fallback bleibt ein bewusst schwacher Notbetrieb und sollte im UI bzw. Logging erkennbar bleiben.

## DEC-007: Snapshot-Policy ist intervallgesteuert und aenderungsbasiert
- Datum: 2026-04-06
- Status: accepted
- Kontext:
  - Ohne Snapshot-Policy wurde der Referenzstand bei jedem Reload ueberschrieben.
  - Dadurch wurde der Diff seit letztem Besuch fuer reale Nutzung und Tests schnell wertlos.
- Entscheidung:
  - Snapshots werden nur aktualisiert, wenn das konfigurierte Intervall abgelaufen ist und sich Werte geaendert haben.
  - Fehlende Positions-Snapshots duerfen trotzdem initial angelegt werden.
- Konsequenzen:
  - Der Referenzstand bleibt zwischen Reloads stabil.
  - Tests und reale Nutzung werden nachvollziehbarer.
  - Snapshot-Zeitpunkt und Intervall werden zu einem expliziten Produktkonzept.

## DEC-008: Eigene clientseitige Sortierung fuer Plugin-Spalten
- Datum: 2026-04-08
- Status: accepted
- Kontext:
  - `finanzen.net` kennt die nachtraeglich eingefuegten Plugin-Spalten nicht und kann sie nicht selbst sortieren.
  - Fuer den Nutzen der Extension ist Sortierung nach den neuen Diff-Werten aber sehr hilfreich.
- Entscheidung:
  - Die Plugin-Spalten `± zuletzt`, `% zuletzt` und `∑ zuletzt` werden clientseitig ueber eine eigene DOM-Sortierung sortierbar gemacht.
- Konsequenzen:
  - Sortierung funktioniert unabhaengig von der nativen Tabellenlogik der Seite.
  - Der Sortierzustand ist rein klientenseitig und nach Reload neu aufzubauen.
  - Sonderzeilen ohne Daten muessen beim Sortieren bewusst nach unten behandelt werden.

## DEC-009: `% zuletzt` beschreibt relative Kursaenderung seit dem Snapshot
- Datum: 2026-04-11
- Status: accepted
- Kontext:
  - Die fruehere Berechnung von `% zuletzt` als Differenz zweier Performance-Prozentwerte seit Kauf war mathematisch moeglich, aber fuer Nutzer wenig intuitiv.
  - Erwartet wird vielmehr die prozentuale Veraenderung des aktuellen Kurses bzw. Gesamtwerts relativ zum letzten gespeicherten Snapshot.
- Entscheidung:
  - `% zuletzt` wird kuenftig als relative Aenderung `((aktuell - Snapshot) / Snapshot) * 100` berechnet.
  - Die Persistenz des Felds `percentagePerformance` wird dafuer nicht mehr benoetigt.
- Konsequenzen:
- `% zuletzt` ist direkt an `± zuletzt` gekoppelt und leichter verstaendlich.
- Die Persistenz kann weiter verschlankt werden.

## DEC-010: Chrome und Firefox teilen sich denselben Laufzeitcode, aber getrennte Release-Pakete
- Datum: 2026-04-12
- Status: accepted
- Kontext:
  - Die aktuelle Extension nutzt nur wenige WebExtension-APIs und ist grundsaetzlich browsernah genug fuer Firefox.
  - Fuer Store- und Signing-Anforderungen unterscheiden sich Chrome und Firefox aber beim Manifest und Packaging.
- Entscheidung:
  - Chrome und Firefox nutzen denselben Popup- und Content-Script-Code.
  - Release-Artefakte werden browsergetrennt gebaut.
  - Firefox-spezifische Manifest-Felder werden nur im Firefox-Build erzeugt.
- Konsequenzen:
  - Der Hauptcode bleibt weitgehend einfach und ohne Browser-Forks.
  - Release-Builds muessen beide Paketvarianten erzeugen.
  - Firefox erhaelt eine eigene Gecko-ID und eigene AMO-Metadaten.

## DEC-011: Erste Firefox-Unterstuetzung ist auf Desktop fokussiert
- Datum: 2026-04-12
- Status: accepted
- Kontext:
  - Der primaere Nutzungskontext der Extension ist die Depotansicht am Desktop.
  - Firefox Android wuerde einen weiteren Test- und Support-Pfad aufmachen.
- Entscheidung:
  - Die erste Firefox-Version wird fuer Desktop vorbereitet.
- Konsequenzen:
  - AMO-Vorbereitung bleibt einfacher.
  - Android kann spaeter separat bewertet werden.

## Offene Entscheidungen
- Soll `localStorage` spaeter durch `chrome.storage` ersetzt werden?
- Wie stark soll die UI spaeter fuer eine moegliche Veroeffentlichung ueberarbeitet werden?
