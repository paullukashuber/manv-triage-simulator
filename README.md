# ManV Triage Simulator

![Version](https://img.shields.io/badge/version-0.3.0-blue)
![Status](https://img.shields.io/badge/status-prototype-orange)
![License](https://img.shields.io/badge/license-MIT-green)

> **Prototyp (v0.3.0)** – Dieses Projekt befindet sich in einer frühen Entwicklungsphase. Inhalte, Algorithmus-Logik und Darstellung können Fehler enthalten. Feedback und Fehlermeldungen sind willkommen – bitte als [Issue](../../issues) melden.

Ein interaktiver, web-basierter Trainingssimulator für die **Patientensichtung beim Massenanfall von Verletzten (ManV)** nach dem **mSTaRT-Algorithmus** (VOR-Sichtung, Region Hannover).

Zieladresse des Betriebs: **https://triage.plhuber.de**

---

## Was ist das?

Der Simulator ermöglicht es Helferinnen und Helfern im Rettungsdienst und Sanitätsdienst, den Sichtungsablauf bei einem Massenanfall von Verletzten interaktiv zu trainieren – ohne reale Patienten, ohne Aufbau einer ManV-Übung.

## Status

**Version 0.3.0 – Rewrite (Prototyp)**
- Neu aufgebaut als TypeScript-Monorepo mit API, Datenbank und Fall-Editor
- Fälle bestehen nur aus Befunden; Kategorie und richtiger Weg durch den Algorithmus werden berechnet
- Fachliche Inhalte sind noch nicht abschließend geprüft, die Seed-Fälle sind zunächst Entwürfe

## Features

- Anonymes Training ohne Konto, Fälle in zufälliger Reihenfolge
- Schritt-für-Schritt VOR-Sichtung mit Feedback und Begründung nach jedem Fall, Fehleranalyse und Gesamtauswertung
- Sichtungslogik an genau einer Stelle (`packages/triage`), von API und Web gemeinsam genutzt und getestet
- Fall-Editor für Ausbilder: Entwurf/Veröffentlicht, Revisionen, Live-Vorschau der berechneten Kategorie, Probelauf
- Anmeldung mit Rollen (Admin, Ausbilder) und Benutzerverwaltung
- Mobile-First Design mit Triage-Farbsystem, i18n-vorbereitet (aktuell Deutsch)

## Architektur

```
apps/
├── api/             Fastify-REST-API, PostgreSQL (Drizzle), Authentifizierung, Seed, Admin-CLI
└── web/             React-SPA: Training, Anmeldung, Fall-Editor, Benutzerverwaltung
packages/
└── triage/          Befunde, Sichtungsalgorithmus, Fall- und Auswertungslogik (geteilt)
deploy/              Docker Compose (nginx + API + PostgreSQL + Backup), Betriebsanleitung
docs/                Spezifikation, Pläne, Inhaltsprüfung
```

Der Browser spricht über nginx mit der API (`/api/`); der Algorithmus läuft in API und Web aus demselben Paket.

## Tech Stack

| Schicht | Technologie |
|---|---|
| Sprache | TypeScript, npm Workspaces |
| Frontend | React 19, Vite, Tailwind CSS 4, TanStack Query, react-i18next |
| Backend | Fastify, Drizzle ORM, better-auth |
| Datenbank | PostgreSQL 17 |
| Geteilte Logik | `@manv/triage` (zod-Schemas, Algorithmus, Auswertung) |
| Tests | Vitest (API-Tests mit PGlite) |
| Betrieb | Docker Compose, GitHub Actions, GHCR |

## Lokale Entwicklung

Voraussetzungen: Node.js 22 oder neuer, Docker.

```bash
git clone https://github.com/PaulLukasHuber/manv-triage-simulator.git
cd manv-triage-simulator
docker compose -f deploy/docker-compose.dev.yml up -d db
cp apps/api/.env.example apps/api/.env
npm install
npm run dev
```

`npm run dev` startet API und Web parallel. Beim Start führt die API Migrationen aus und legt die Seed-Fälle an
(lokal mit `SEED_PUBLISH=true` direkt veröffentlicht). Einen Admin legt die CLI an:

```bash
cd apps/api && npx tsx --env-file=.env src/cli.ts create-admin --email admin@example.org --name "Name"
```

## Tests und Qualitätssicherung

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Betrieb

Docker-Compose-Stack, Ersteinrichtung, Backups und Updates: [deploy/README.md](deploy/README.md).
Seed-Fälle prüfen und freigeben: [docs/content/seed-cases-review.md](docs/content/seed-cases-review.md).

## Roadmap

- [x] Fall-Editor für Ausbilder
- [x] Datenbank statt fest eingebauter Szenarien
- [ ] Konten für Teilnehmende mit Fortschritt und Lernfeldern (nächster Schritt, Phase 3)
- [ ] Gruppen/Kurse für Ausbilder
- [ ] Qualifikationswahl (SanH / RS / RA / NotSan)
- [ ] Modus „Vollständige Sichtung" (ABCDE mit LSM-Entscheidungen)
- [ ] Übungsmodus ManV-Lage (mehrere Patienten mit Zeitdruck)
- [ ] Lernkarten / Algorithmus-Referenz
- [ ] PWA / Offline-Fähigkeit
- [ ] Englische Übersetzung

## Fachlicher Hintergrund

Der Simulator basiert auf:
- **mSTaRT** (modified Simple Triage and Rapid Treatment)
- Checkliste VOR-Sichtung, Algorithmus Region Hannover
- Lebensrettende Sofortmaßnahmen (LSM-Karte)

## Mitmachen

Feedback, Fehlermeldungen und Beiträge sind willkommen! Siehe [CONTRIBUTING.md](CONTRIBUTING.md).

## Lizenz

MIT – siehe [LICENSE](LICENSE).

---

> **Hinweis:** Dieses Tool dient ausschließlich zu Trainingszwecken und ersetzt keine zertifizierte Ausbildung. Bei Widersprüchen gilt immer das aktuellste offizielle Schulungsmaterial.
