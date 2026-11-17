# Contributing

Danke für dein Interesse am ManV Triage Simulator! Das Projekt befindet sich in einer frühen Phase – Feedback, Fehlermeldungen und Beiträge sind willkommen.

## Fehler melden

- Öffne ein [Issue](../../issues) mit einer kurzen Beschreibung
- Besonders hilfreich: Screenshot, Browser/Gerät, Schritte zum Reproduzieren
- **Fachliche Fehler** (falscher Algorithmus, falsche SK-Zuordnung) bitte besonders kennzeichnen

## Entwickeln

Das Repo ist ein npm-Workspaces-Monorepo (`apps/api`, `apps/web`, `packages/triage`). Einrichtung siehe [README.md](README.md#lokale-entwicklung).

Vor jedem Pull Request im Repo-Root:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Beitragen

1. Fork → Branch (`feature/mein-feature`) → Pull Request
2. Bitte auf `develop` basieren, nicht auf `main`
3. Code-Keys auf Englisch, UI-Texte in `apps/web/src/i18n/`
4. Änderungen an der Sichtungslogik gehören ausschließlich nach `packages/triage` und brauchen Tests
5. Neue Fälle werden im Fall-Editor angelegt, nicht im Code; Seed-Fälle stehen in `apps/api/src/seed/cases.ts`

## Hinweis

Dieses Tool dient ausschließlich zu Trainingszwecken. Änderungen am Algorithmus oder an den Sichtungskategorien müssen fachlich fundiert sein und sich an den offiziellen Schulungsunterlagen orientieren.
