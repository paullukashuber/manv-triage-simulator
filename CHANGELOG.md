# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Wertung nach Kategorie und Weg

- Ein Fall gilt nur noch als korrekt, wenn Kategorie **und** Weg stimmen, also beim entscheidenden Schritt angehalten wurde. Bisher reichte die richtige Kategorie, sodass z. B. „Ja“ bei X jeden SK-1-Fall als korrekt wertete.
- Neuer Zwischenzustand „Kategorie richtig, Weg falsch“ in Ergebnis und Auswertung, mit Hinweis auf den entscheidenden Schritt
- Antworten nach dem entscheidenden Schritt werden als „nicht gewertet“ getrennt angezeigt

## [0.3.0] – 2026-11-17

### Rewrite: TypeScript-Monorepo mit API, Datenbank und Fall-Editor

- Neuer Aufbau als npm-Workspaces-Monorepo: `apps/api` (Fastify, PostgreSQL, Drizzle), `apps/web` (React 19, Vite, Tailwind CSS 4), `packages/triage` (geteilte Sichtungslogik)
- Fälle werden nur noch als Befunde gespeichert; Kategorie und richtiger Weg durch den Algorithmus werden berechnet und per Tests abgesichert
- 33 Seed-Fälle (18 überarbeitete Altfälle, 15 neue) als Entwurf; Prüfliste in `docs/content/seed-cases-review.md`
- Fall-Editor für Ausbilder mit Entwurf/Veröffentlicht, Revisionen, Live-Vorschau und Probelauf
- Anmeldung mit Rollen, Benutzerverwaltung und Admin-CLI
- Anonymes Training ohne Konto weiterhin möglich
- Betrieb über Docker Compose (nginx, API, PostgreSQL, tägliches Backup); CI und Deployment per GitHub Actions nach GHCR
- Entfernt: GitHub-Pages-Deployment, „Fall einreichen“ (öffentliche Einreichung und Prüfung); alte Einreichungen werden nicht übernommen

## [0.2] – 2026-03-20

### Migration to React + Vite + Tailwind

- Complete rebuild on React 19 + Vite + Tailwind CSS 4
- Modular component architecture (9 components, 5 screens)
- Central state logic via useSimulator hook (useReducer)
- i18n preparation: all UI strings in src/i18n/de.js
- English code keys, German UI output
- Design: Slate Teal accent color, compact layout, sticky action buttons
- DM Sans font via Google Fonts
- Triage color system: color only where it carries meaning
- Patient data stays visible throughout entire triage process
- Barrier tape reminder after triage completion
- Prototype warning modal on first load
- GitHub Actions workflow for automated deployment

## [0.1] – 2026-03-19

### Initial prototype (Vanilla HTML)

- Pre-triage (VOR-Sichtung) algorithm
- 8 patient scenarios with correct triage category assignments
- Step-by-step triage with yes/no decisions
- Feedback after completed triage (not per individual step)
- Patient data visible during entire triage process
- Barrier tape reminder after triage completion
- Summary with error analysis
- Prototype warning popup
- Mobile-first design with triage color system
- Published on GitHub Pages