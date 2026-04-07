# decisions.md

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

## DEC-006: Zuordnungsproblem bei Positionen ist bekannt, aber noch nicht geloest
- Datum: 2026-03-15
- Status: proposed
- Kontext:
  - Einzelne Tabellenzeilen lassen sich nicht immer eindeutig ueber eine stabile ID identifizieren.
  - Name und sichtbare Werte reichen moeglicherweise nicht immer fuer eine robuste Wiedererkennung aus, insbesondere bei Sortierung oder mehrfach vorkommenden Eintraegen.
- Entscheidung:
  - Das Problem wird vorerst als offenes Architekturthema behandelt und nicht mit einer vorschnellen Heuristik als "geloest" angesehen.
- Konsequenzen:
  - Zunaechst werden reale Faelle gesammelt und die aktuelle Datenzuordnung analysiert.
  - Eine kuenftige Entscheidung ueber einen stabileren Schluessel oder Matching-Ansatz ist notwendig.

## Offene Entscheidungen
- Soll `localStorage` spaeter durch `chrome.storage` ersetzt werden?
- Welcher Schluessel identifiziert eine Depotposition robust genug ueber mehrere Besuche hinweg?
- Wie stark soll die UI spaeter fuer eine moegliche Veroeffentlichung ueberarbeitet werden?
