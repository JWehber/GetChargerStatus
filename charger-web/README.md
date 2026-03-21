# GetChargerStatus Web ⚡

Eine moderne, responsive GitHub-Pages-Webseite zum Überwachen einer konkreten E-Auto-Ladesäule in Oldenburg.

## Ziel

Die App zeigt den aktuellen Status der EWE-Go-Ladesäule an der:

- **Nettelbeckstraße 24**
- **26131 Oldenburg**

Im Fokus stehen:
- klarer Status auf einen Blick
- mobile Nutzbarkeit
- schnelle Ladezeit
- sichere Datenanbindung ohne API-Key im Frontend

## Architektur

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS (via `@tailwindcss/vite`)

### Datenfluss
- Die Webseite liest **nur** aus `public/status.json`
- Eine GitHub Action aktualisiert diese Datei regelmäßig über die **TomTom EV Charging Availability API**
- Der TomTom-Key bleibt dabei als **GitHub Secret** außerhalb des Frontends

## Sicherheit

Der API-Key gehört **nicht** in den Browser-Code.
Darum nutzt dieses Projekt ein Snapshot-Modell:

1. GitHub Action ruft TomTom serverseitig ab
2. erzeugt `status.json`
3. baut und deployt die Seite auf GitHub Pages

## Wichtige Dateien

- `src/App.tsx` – UI
- `src/api/charger.ts` – Laden der öffentlichen `status.json`
- `src/hooks/useChargerStatus.ts` – Polling / Refresh-Logik
- `src/types/charger.ts` – Typen
- `scripts/update-status.mjs` – TomTom → `public/status.json`
- `.github/workflows/deploy.yml` – Build + Deploy + Snapshot-Update

## Lokale Entwicklung

```bash
npm install
npm run dev
```

## Lokaler Build

```bash
npm run build
```

## Snapshot lokal aktualisieren

Dafür muss die Umgebungsvariable gesetzt sein:

```bash
export TOMTOM_API_KEY="dein_key"
npm run update-status
```

## GitHub Setup

In GitHub Actions muss ein Secret gesetzt werden:

- `TOMTOM_API_KEY`

Danach kann die Action die Statusdaten automatisch aktualisieren und die Seite deployen.

## Hinweis

Diese Lösung wurde mit Unterstützung von **OpenClaw / Jarvis** generiert und umgesetzt 🤖

## Status

MVP live 🚀
