# Firefox AMO Release

## Ziel

Diese Notiz beschreibt den Release-Stand fuer Mozilla Firefox und addons.mozilla.org.

## Browser-Modell

Die Extension wird zunaechst fuer Firefox Desktop vorbereitet.

Aktueller Ansatz:

- gemeinsamer Codepfad fuer Chrome und Firefox
- separates Release-Paket fuer Firefox
- Firefox-spezifisches Manifest nur im Build-Artefakt

## Firefox-spezifische Manifest-Felder

Das Firefox-Release-Paket ergaenzt:

```json
"browser_specific_settings": {
  "gecko": {
    "id": "finanzen-net-last-visit-diff@zeberti.github.io",
    "strict_min_version": "128.0",
    "data_collection_permissions": {
      "required": ["none"]
    }
  }
}
```

## Release-Artefakt

Das Firefox-Paket wird erzeugt mit:

```bash
npm run build:release
```

Relevante Datei:

- `dist/finanzen-net-last-visit-diff-firefox.zip`

## Kompatibilitaet

Die Laufzeit verwendet eine kleine browser-neutrale API-Schicht fuer:

- `runtime`
- `tabs`
- `storage.local`

Damit bleibt derselbe Popup- und Content-Script-Code in Chrome und Firefox nutzbar.

## Noch offen vor echtem AMO-Upload

- Firefox manuell mit temporaer geladener Extension testen
- Screenshots bei Bedarf fuer Firefox erneut aufnehmen
- AMO-Listing mit Beschreibung und Privacy-Policy-Link fuellen
