# Triage-Simulator-Rewrite (Phase 1 + 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den bestehenden Frontend-only-Simulator durch ein TypeScript-Monorepo ersetzen – gemeinsames Algorithmus-Paket, Fastify-API mit PostgreSQL, neues React-Training ohne Konto, Ausbilder-Login mit Fall-Editor und ein eigenständiger Docker-Compose-Stack.

**Architecture:** npm-Workspaces mit `packages/triage` (reine TS-Logik + zod-Schemas, wird von Web und API direkt als TS-Quelle importiert), `apps/api` (Fastify 5, Drizzle ORM, better-auth, gebündelt mit tsup) und `apps/web` (Vite, React 19, React Router, TanStack Query, i18next, Tailwind 4). Docker Compose (`name: manv-triage-app`) mit `web` (nginx, Port `127.0.0.1:3010`, Proxy `/api`), `api`, `db` (postgres:17-alpine), `backup`.

**Tech Stack:** Node 24 (Docker `node:24-alpine`), TypeScript, React 19, Vite, Tailwind CSS 4, React Router, TanStack Query 5, i18next/react-i18next, Fastify 5, Drizzle ORM + drizzle-kit, postgres.js, PGlite (Tests), better-auth (+ admin-Plugin), zod 4, Vitest, Testing Library, tsup, ESLint (flat config, typescript-eslint).

**Spec:** `docs/superpowers/specs/2026-11-16-triage-simulator-rewrite-design.md`

## Global Constraints

- Code-Bezeichner Englisch, **alle UI-Texte Deutsch** und ausschließlich über i18next (`apps/web/src/i18n/de.ts`), keine hartkodierten UI-Strings in Komponenten.
- Die Sichtungslogik existiert **nur** in `packages/triage`. Web und API importieren sie; keine Kopie, keine zweite Implementierung (auch nicht in SQL).
- Algorithmus-Reihenfolge exakt: `tourniquet → ambulatory → deathSigns → stridor → airwayBlocked → abnormalBreathingRate → majorBleeding → noRadialPulse → unresponsive`; erster zutreffender Schritt beendet; X/A/B/C/D → `red`, `ambulatory` → `white`, `deathSigns` → `dead`, nichts → `yellow`.
- AF pathologisch: Erwachsene `< 10` oder `> 30`, Kinder `< 15` oder `> 40`; `respiratoryRate: null` gilt als unauffällig.
- Kategorie-IDs `red | yellow | white | dead`; Anzeige „SK 1“, „SK 2“, „PAK weiß“, „Tot“.
- Fall-Status `draft | published | archived`. Training liest **nur** veröffentlichte Revisionen (`case_revisions`), nie den Arbeitsstand.
- Veröffentlichen ist gesperrt, wenn `expectedCategory !== triage(findings).category`.
- Rollen `trainee | trainer | admin`. Öffentliche Registrierung ist in diesem Plan **deaktiviert** (kommt in Phase 3). Editor-API nur für `trainer` und `admin`; Nutzerverwaltung nur für `admin`.
- Ausbilder sehen keine Ergebnisse anderer Nutzer (in Phase 1–2 werden keine Ergebnisse gespeichert).
- Anonymes Training: kein Login, kein Cookie-Banner, keine Tracker, keine externen Requests (Schrift wird selbst gehostet über `@fontsource/dm-sans`, nicht Google Fonts).
- Optik: dunkles Theme mit den bestehenden Farbwerten aus `src/index.css` (`--color-sk1: #cc0000`, `--color-sk2: #ffcc00`, `--color-white: #f0f0f0`, `--color-dead: #444444`, `--color-bg: #111214`, `--color-accent: #6CBDB5` usw.), Mobile-First, Training max. 480 px breit, Aktions-Buttons sticky unten. Editor desktop-optimiert, mobil benutzbar.
- Version nur an einer Stelle: Root-`package.json` `"version": "0.3.0"`, im Web per Vite-`define` als `__APP_VERSION__`.
- Prototyp-Hinweis bleibt (Modal beim ersten Besuch).
- Neuer Stack berührt den alten nicht: eigenes Compose-Projekt `manv-triage-app`, eigenes Volume, Server-Pfad `/opt/manv-triage-app`, Web-Port `127.0.0.1:3010`.
- Jeder Task endet mit grünem `npm run lint && npm run typecheck && npm test` im Repo-Root.

## Review Focus

- **Keine freigegebenen Fälle** (frischer Deploy, alle Seed-Fälle sind `draft`): Training zeigt eine klare Meldung statt leerem Screen oder Absturz → Test in Task 7.
- **Weniger veröffentlichte Fälle als 10**: Durchgang nutzt alle vorhandenen, Zähler zeigt „Patient 1 von N“ mit echtem N → Tests in Task 4 und Task 7.
- **Ungültige Editor-Eingaben** (AF negativ/Kommazahl/> 80, unbekannte Befund-Schlüssel, leere Beschreibung): API antwortet 400 mit Feldfehlern, nichts wird gespeichert → Tests in Task 1 und Task 10.
- **Bearbeiten eines veröffentlichten Falls** ändert nicht, was Teilnehmende sehen, bis erneut veröffentlicht wird → Test in Task 10.
- **Abgelaufene/fehlende Sitzung** im Editor: API 401, Web leitet auf `/login` und nach Login zurück → Tests in Task 9 und Task 11.

---

## Dateistruktur (Ziel)

```
package.json                 Workspaces, Root-Skripte, version 0.3.0
tsconfig.base.json           gemeinsame TS-Optionen (strict, moduleResolution bundler)
eslint.config.js             flat config (typescript-eslint, react-hooks)
vitest.config.ts             test.projects: packages/*, apps/*
packages/triage/
  src/findings.ts            findingsSchema, Findings, defaultFindings
  src/steps.ts               STEP_KEYS, STEPS, Category, LearningField, ALGORITHM_VERSION
  src/algorithm.ts           isRespiratoryRatePathological, evaluateStep, triage
  src/grading.ts             gradeRun, InvalidRunError
  src/case.ts                caseInputSchema, CaseInput, trainingCaseSchema
  src/index.ts               Re-Exports
apps/api/
  src/config.ts              loadConfig
  src/db/schema.ts           cases, caseRevisions (+ auth-Tabellen ab Task 10)
  src/db/client.ts           createDb, migrateDb, createTestDb
  src/app.ts                 buildApp
  src/server.ts              Start: Config → DB → Migration → Seed → listen
  src/cli.ts                 Admin-CLI (Task 10)
  src/cases/service.ts       Fall-Domänenlogik
  src/cases/training-routes.ts  öffentliche Trainings-Route
  src/cases/editor-routes.ts    Editor-Routen (Task 11)
  src/auth/auth.ts           better-auth (Task 10)
  src/auth/guards.ts         requireRole (Task 10)
  src/seed/cases.ts          Seed-Fälle (Task 6)
  src/seed/seed.ts           seedCases
  drizzle/                   generierte Migrationen
apps/web/
  src/main.tsx, src/App.tsx, src/routes.tsx
  src/styles.css             Tailwind + @theme-Tokens
  src/i18n/index.ts, src/i18n/de.ts
  src/components/ui/         Button, Card, CategoryBadge, StepBadge, ProgressBar, BarrierTape, PatientBanner, Header, PrototypeModal
  src/lib/api.ts             fetch-Wrapper (ApiError)
  src/training/              machine.ts, TrainingRunner.tsx, screens/*, useTrainingCases.ts
  src/auth/                  auth-client.ts, RequireRole.tsx, LoginPage.tsx
  src/editor/                CaseListPage.tsx, CaseEditPage.tsx, CaseForm.tsx, TriagePreview.tsx, api.ts
  src/admin/                 UsersPage.tsx
apps/api/Dockerfile, apps/web/Dockerfile
deploy/docker-compose.yml, deploy/docker-compose.build.yml, deploy/docker-compose.dev.yml,
deploy/nginx.conf, deploy/.env.example, deploy/README.md
.github/workflows/ci.yml, .github/workflows/deploy.yml
```

Entfällt: Root-`index.html`, `src/`, `vite.config.js`, `postcss.config.js`, `tailwind.config.js`, Root-`Dockerfile`, `deploy/nginx-frontend.conf` (Task 6 bzw. 8).

**Nicht in diesem Plan (Phase 3, eigener Plan):** Registrierung für Teilnehmende, gespeicherte Durchgänge (`training_sessions`, `attempts`, `attempt_step_results`), Fortschritt, Lernfeld-Auswertung, gezieltes Üben, Konto löschen, Hinweis „Mit Konto Fortschritt speichern“, SMTP. `public/favicon.svg` wandert nach `apps/web/public/`.

---

### Task 1: Monorepo-Gerüst und Befund-/Fall-Schemas

**Files:**
- Create: `package.json` (ersetzen), `tsconfig.base.json`, `eslint.config.js` (ersetzen), `vitest.config.ts`, `packages/triage/package.json`, `packages/triage/tsconfig.json`, `packages/triage/src/findings.ts`, `packages/triage/src/steps.ts`, `packages/triage/src/case.ts`, `packages/triage/src/index.ts`
- Test: `packages/triage/src/findings.test.ts`, `packages/triage/src/case.test.ts`

**Interfaces:**
- Produces:
  - Root-Skripte: `lint` (`eslint .`), `typecheck` (Typecheck aller Workspaces, je `tsc --noEmit`), `test` (`vitest run`), `build`, `dev`.
  - Paket `@manv/triage`, `"type": "module"`, `exports: { ".": "./src/index.ts" }` (kein Build-Schritt; Konsumenten bündeln die TS-Quelle).
  - `findingsSchema` (zod, `.strict()`), `type Findings = { lifeThreateningExtremityBleeding: boolean; ambulatory: boolean; definiteDeathSigns: boolean; inhalationTraumaStridor: boolean; airwayNeedsManagement: boolean; ageGroup: 'adult' | 'child'; respiratoryRate: number | null; lifeThreateningBleeding: boolean; radialPulsePalpable: boolean; respondsPurposefully: boolean }`
  - `defaultFindings(): Findings` – alles `false`, außer `radialPulsePalpable: true`, `respondsPurposefully: true`, `ageGroup: 'adult'`, `respiratoryRate: null`.
  - `STEP_KEYS` (readonly Tupel in Algorithmus-Reihenfolge, s. Global Constraints), `type StepKey`.
  - `type Category = 'red' | 'yellow' | 'white' | 'dead'`, `CATEGORIES` (readonly Array), `categorySchema`.
  - `type LearningField = 'x' | 'ambulatory' | 'death' | 'a' | 'b' | 'c' | 'd'`, `LEARNING_FIELDS`, `learningFieldSchema`.
  - `type StepDefinition = { key: StepKey; learningField: LearningField; badge: 'x' | 'walk' | 'dead' | 'a' | 'b' | 'c' | 'd'; resultIfYes: Category }`, `STEPS: readonly StepDefinition[]` – Zuordnung: tourniquet→x/x/red, ambulatory→ambulatory/walk/white, deathSigns→death/dead/dead, stridor→a/a/red, airwayBlocked→a/a/red, abnormalBreathingRate→b/b/red, majorBleeding→c/c/red, noRadialPulse→c/c/red, unresponsive→d/d/red.
  - `FALLBACK_CATEGORY: Category = 'yellow'`, `ALGORITHM_VERSION = '1.0.0'`.
  - `caseInputSchema` (zod, strict): `description` string trim 10–4000, `reasoning` string trim 10–4000, `findings: findingsSchema`, `expectedCategory: categorySchema`, `focusFields: learningFieldSchema[]` (eindeutig, max 7), `tags: string[]` (je trim 1–40, max 10, eindeutig). `type CaseInput`.
  - `trainingCaseSchema` / `type TrainingCase = { caseId: string; revisionId: string; description: string; reasoning: string; findings: Findings; focusFields: LearningField[] }`.

- [ ] **Step 1: Root-Gerüst anlegen.** Root-`package.json` (`"private": true`, `"version": "0.3.0"`, `"workspaces": ["packages/*", "apps/*"]`, `"engines": { "node": ">=22" }`), `tsconfig.base.json` (`strict`, `noUncheckedIndexedAccess`, `moduleResolution: "bundler"`, `module: "ESNext"`, `target: "ES2022"`, `verbatimModuleSyntax`), `vitest.config.ts` mit `test.projects`, ESLint flat config mit typescript-eslint + react-hooks (ignoriert `dist`, `drizzle`, `src/` des Altbestands bis Task 6). TypeScript: neueste Hauptversion, die im Peer-Bereich von typescript-eslint liegt. Altes `src/` bleibt bis Task 6 liegen, wird aber von Lint/Typecheck ausgeschlossen.
- [ ] **Step 2: Failing Tests schreiben** (`findings.test.ts`, `case.test.ts`):
  - `defaultFindings()` erfüllt `findingsSchema` und hat exakt die oben genannten Werte.
  - `findingsSchema` lehnt ab: `respiratoryRate: -1`, `12.5`, `81`; unbekannten Schlüssel `foo: true`; fehlendes `ageGroup`. Akzeptiert `respiratoryRate: 0`, `80`, `null`.
  - `STEPS.map(s => s.key)` deep-equals `STEP_KEYS`; `STEPS` hat 9 Einträge mit den Zuordnungen oben.
  - `caseInputSchema` lehnt ab: Beschreibung `"kurz"`, doppelte `focusFields`, 11 Tags, Tag `""`; akzeptiert einen vollständigen gültigen Fall.
- [ ] **Step 3:** `npx vitest run packages/triage` → FAIL (Module fehlen).
- [ ] **Step 4:** `findings.ts`, `steps.ts`, `case.ts`, `index.ts` implementieren.
- [ ] **Step 5:** `npm run lint && npm run typecheck && npm test` → PASS.
- [ ] **Step 6: Commit** `feat(triage): monorepo scaffold and findings/case schemas`

---

### Task 2: Sichtungsalgorithmus und Bewertung

**Files:**
- Create: `packages/triage/src/algorithm.ts`, `packages/triage/src/grading.ts`; Modify: `packages/triage/src/index.ts`
- Test: `packages/triage/src/algorithm.test.ts`, `packages/triage/src/grading.test.ts`

**Interfaces:**
- Consumes: Task 1 (`Findings`, `StepKey`, `STEPS`, `Category`, `LearningField`, `FALLBACK_CATEGORY`).
- Produces:
  - `isRespiratoryRatePathological(rate: number | null, ageGroup: 'adult' | 'child'): boolean`
  - `evaluateStep(key: StepKey, findings: Findings): boolean` – Zuordnung: tourniquet←`lifeThreateningExtremityBleeding`, ambulatory←`ambulatory`, deathSigns←`definiteDeathSigns`, stridor←`inhalationTraumaStridor`, airwayBlocked←`airwayNeedsManagement`, abnormalBreathingRate←`isRespiratoryRatePathological(...)`, majorBleeding←`lifeThreateningBleeding`, noRadialPulse←`!radialPulsePalpable`, unresponsive←`!respondsPurposefully`.
  - `type TriageResult = { category: Category; decisiveStep: StepKey | null; path: { key: StepKey; applies: boolean }[] }` – `path` = alle ausgewerteten Schritte bis einschließlich des entscheidenden (bei `yellow` alle 9).
  - `triage(findings: Findings): TriageResult`
  - `type RunAnswer = { key: StepKey; answer: boolean }`
  - `type StepResult = { key: StepKey; learningField: LearningField; userAnswer: boolean; correctAnswer: boolean; isCorrect: boolean; errorType: 'missed' | 'overcalled' | null }` (`missed` = Befund lag vor, Nutzer „Nein“; `overcalled` = Nutzer „Ja“ ohne Befund)
  - `type GradeResult = { userCategory: Category; correctCategory: Category; isCorrect: boolean; decisiveStep: StepKey | null; stepResults: StepResult[]; stoppedEarly: boolean; passedDecisiveStep: boolean }`
  - `gradeRun(findings: Findings, answers: RunAnswer[]): GradeResult` – wirft `InvalidRunError`, wenn `answers` kein gültiger Durchlauf ist: leer; Schlüssel nicht exakt Präfix von `STEP_KEYS`; ein `true` nicht an letzter Stelle; endet mit `false` vor dem 9. Schritt.
  - `stoppedEarly` = Nutzer stoppte mit „Ja“ an einem Index vor dem entscheidenden Schritt (oder es gibt keinen entscheidenden Schritt). `passedDecisiveStep` = Nutzer antwortete am entscheidenden Schritt „Nein“.

- [ ] **Step 1: Failing Tests** (`algorithm.test.ts`):
  - `triage(defaultFindings())` → `{ category: 'yellow', decisiveStep: null }`, `path.length === 9`, alle `applies: false`.
  - X schlägt Gehfähig: `{...default, lifeThreateningExtremityBleeding: true, ambulatory: true}` → `red`, `tourniquet`, `path.length === 1`.
  - `ambulatory` → `white`, `path` = `[{tourniquet,false},{ambulatory,true}]`.
  - `definiteDeathSigns` → `dead`/`deathSigns`; Stridor → `red`/`stridor`; Atemweg → `red`/`airwayBlocked`; `lifeThreateningBleeding` → `red`/`majorBleeding`; `radialPulsePalpable: false` → `red`/`noRadialPulse`; `respondsPurposefully: false` → `red`/`unresponsive`.
  - `isRespiratoryRatePathological`: adult 9→true, 10→false, 30→false, 31→true; child 14→true, 15→false, 40→false, 41→true; `null`→false (beide Altersgruppen).
- [ ] **Step 2: Failing Tests** (`grading.test.ts`):
  - Korrekt: Befund gehfähig, Antworten `[tourniquet:false, ambulatory:true]` → `isCorrect`, `userCategory 'white'`, alle `stepResults[].isCorrect`, `stoppedEarly false`, `passedDecisiveStep false`.
  - Zu früh gestoppt: `{...default, respiratoryRate: 34}`, Antworten `[tourniquet:false, ambulatory:true]` → `userCategory 'white'`, `correctCategory 'red'`, `stoppedEarly true`, `stepResults[1].errorType 'overcalled'`.
  - Entscheidenden Schritt übergangen: Befund gehfähig, 9× `false` → `userCategory 'yellow'`, `passedDecisiveStep true`, `stepResults[1].errorType 'missed'`, `stepResults.length 9`.
  - Spätere Schritte gegen Befunde bewertet: `{...default, airwayNeedsManagement: true, respondsPurposefully: false}`, 9× `false` → `stepResults[8]` (`unresponsive`) hat `correctAnswer true`, `errorType 'missed'`, `learningField 'd'`.
  - `InvalidRunError` bei: `[]`; `[ambulatory:false]` (falscher Start); `[tourniquet:true, ambulatory:false]` (nach Ja weiter); `[tourniquet:false, ambulatory:false, deathSigns:false]` (endet auf Nein vor Schritt 9).
- [ ] **Step 3:** `npx vitest run packages/triage` → FAIL.
- [ ] **Step 4:** `algorithm.ts`, `grading.ts` implementieren, aus `index.ts` exportieren.
- [ ] **Step 5:** `npm run lint && npm run typecheck && npm test` → PASS.
- [ ] **Step 6: Commit** `feat(triage): triage algorithm and run grading`

---

### Task 3: API-Gerüst, Konfiguration, Datenbankschema

**Files:**
- Create: `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/tsup.config.ts`, `apps/api/drizzle.config.ts`, `apps/api/src/config.ts`, `apps/api/src/db/schema.ts`, `apps/api/src/db/client.ts`, `apps/api/src/app.ts`, `apps/api/src/server.ts`, `apps/api/drizzle/*` (generiert), `apps/api/.env.example`, `deploy/docker-compose.dev.yml`
- Test: `apps/api/src/config.test.ts`, `apps/api/src/app.test.ts`, `apps/api/src/test/setup.ts` (Helfer)

**Interfaces:**
- Consumes: `@manv/triage` (Typen für JSONB-Spalten).
- Produces:
  - `type Config = { databaseUrl: string; port: number; publicUrl: string; authSecret: string; seedPublish: boolean; nodeEnv: 'development' | 'production' | 'test' }`; `loadConfig(env: Record<string, string | undefined>): Config` – Variablen `DATABASE_URL` (Pflicht), `PORT` (Default 3001), `PUBLIC_URL` (Pflicht, URL), `AUTH_SECRET` (Pflicht, min. 32 Zeichen), `SEED_PUBLISH` (`"true"`/`"false"`, Default false), `NODE_ENV`. Fehler → wirft mit Liste der fehlenden/ungültigen Variablen.
  - Drizzle-Tabellen in `schema.ts`:
    - `cases`: `id uuid pk defaultRandom`, `slug text unique null`, `description text`, `reasoning text`, `findings jsonb $type<Findings>`, `expectedCategory text`, `focusFields text[] default '{}'`, `tags text[] default '{}'`, `computedCategory text`, `decisiveStep text null`, `status text default 'draft'`, `authorId text null`, `publishedRevisionId uuid null`, `createdAt`, `updatedAt` (timestamptz, default now).
    - `caseRevisions`: `id uuid pk`, `caseId uuid fk→cases.id on delete cascade`, `revisionNumber int`, `description`, `reasoning`, `findings jsonb`, `focusFields text[]`, `tags text[]`, `computedCategory`, `decisiveStep null`, `algorithmVersion text`, `publishedAt timestamptz`, `publishedBy text null`; unique `(caseId, revisionNumber)`.
  - `type Db` (Drizzle-PG-Datenbanktyp, der für postgres.js und PGlite passt); `createDb(url: string): { db: Db; close(): Promise<void> }`; `migrateDb(db: Db): Promise<void>` (Ordner `apps/api/drizzle`); `createTestDb(): Promise<Db>` (PGlite in-memory, migriert).
  - `buildApp(deps: { db: Db; config: Config }): Promise<FastifyInstance>` – registriert Routen, `GET /api/health` → `200 { status: 'ok' }`.
  - `src/server.ts`: Config laden → DB → `migrateDb` → (ab Task 4: Seed) → `listen({ host: '0.0.0.0', port })`.
  - Skripte `apps/api`: `dev` (tsx watch src/server.ts mit `.env`), `build` (tsup → `dist/server.js`, `dist/cli.js`; bündelt `@manv/triage`, externalisiert node_modules), `db:generate` (drizzle-kit generate), `typecheck`.
  - `deploy/docker-compose.dev.yml`: nur `db` (postgres:17-alpine) auf `127.0.0.1:5433`, Volume `dev_db_data`.

- [ ] **Step 1: Failing Tests:** `loadConfig` mit vollständigem Env → erwartetes Objekt (`port 3001` bei fehlendem `PORT`, `seedPublish false`); ohne `AUTH_SECRET` → wirft, Meldung enthält `AUTH_SECRET`; `AUTH_SECRET` mit 10 Zeichen → wirft. `buildApp` mit `createTestDb()` → `GET /api/health` (via `app.inject`) liefert 200 `{status:'ok'}`; Test prüft zusätzlich, dass Tabelle `cases` existiert (Select liefert `[]`).
- [ ] **Step 2:** `npx vitest run apps/api` → FAIL.
- [ ] **Step 3:** Implementieren, `npm run db:generate -w @manv/api` erzeugt die erste Migration.
- [ ] **Step 4:** `npm run lint && npm run typecheck && npm test` → PASS. Zusätzlich: `docker compose -f deploy/docker-compose.dev.yml up -d db`, `.env` aus `.env.example` (DATABASE_URL `postgres://manv:manv@127.0.0.1:5433/manv`), `npm run dev -w @manv/api`, `curl -s localhost:3001/api/health` → `{"status":"ok"}`; danach stoppen.
- [ ] **Step 5: Commit** `feat(api): fastify scaffold, config, drizzle schema for cases`

---

### Task 4: Fall-Service, Seeding und öffentliche Trainings-Route

**Files:**
- Create: `apps/api/src/cases/service.ts`, `apps/api/src/cases/training-routes.ts`, `apps/api/src/seed/seed.ts`, `apps/api/src/seed/cases.ts` (Platzhalter mit 3 Fällen, Task 5 füllt), Modify: `apps/api/src/app.ts`, `apps/api/src/server.ts`
- Test: `apps/api/src/cases/service.test.ts`, `apps/api/src/cases/training-routes.test.ts`, `apps/api/src/seed/seed.test.ts`

**Interfaces:**
- Consumes: Task 1–3 (`caseInputSchema`, `CaseInput`, `triage`, `ALGORITHM_VERSION`, `TrainingCase`, `Db`, Tabellen).
- Produces:
  - `type CaseRecord` (= Drizzle-Select-Typ von `cases`).
  - `createCase(db: Db, input: CaseInput, authorId: string | null, slug?: string): Promise<CaseRecord>` – berechnet `computedCategory`/`decisiveStep` via `triage`, Status `draft`.
  - `class ExpectedCategoryMismatchError extends Error { expected: Category; computed: Category }`
  - `publishCase(db: Db, caseId: string, userId: string | null): Promise<CaseRecord>` – wirft `ExpectedCategoryMismatchError` bei Abweichung; legt Revision mit `revisionNumber = max+1` und `algorithmVersion = ALGORITHM_VERSION` an; setzt `status 'published'`, `publishedRevisionId`. Atomar (Transaktion).
  - `listTrainingCases(db: Db, count: number): Promise<TrainingCase[]>` – zufällige Auswahl (max. `count`) aus Revisionen, deren Fall `status = 'published'` hat und `publishedRevisionId` auf genau diese Revision zeigt.
  - `type SeedCase = CaseInput & { slug: string }`; `seedCases(db: Db, seeds: SeedCase[], opts: { publish: boolean }): Promise<{ inserted: number }>` – **nur wenn `cases` leer ist**, sonst `{ inserted: 0 }`.
  - Route `GET /api/training/cases?count=N` (N ganzzahlig 1–30, Default 10; sonst 400) → `200 { cases: TrainingCase[] }`.
  - `server.ts` ruft nach der Migration `seedCases(db, SEED_CASES, { publish: config.seedPublish })` auf.

- [ ] **Step 1: Failing Tests:**
  - `createCase` mit Befund gehfähig → `computedCategory 'white'`, `decisiveStep 'ambulatory'`, `status 'draft'`.
  - `publishCase` mit passender Soll-Kategorie → Revision 1, Status `published`; zweites Publish → Revision 2, `publishedRevisionId` zeigt auf Revision 2.
  - `publishCase` mit `expectedCategory 'yellow'` bei berechnet `white` → wirft `ExpectedCategoryMismatchError` (`expected 'yellow'`, `computed 'white'`), keine Revision angelegt.
  - `listTrainingCases`: Draft-Fälle und archivierte Fälle erscheinen nicht; bei 3 veröffentlichten und `count 10` → genau 3; bei `count 2` → 2.
  - `seedCases` auf leerer DB mit `publish:false` → alle `draft`; zweiter Aufruf → `inserted 0`; mit `publish:true` → alle `published`.
  - Route: `count=0`, `count=31`, `count=abc` → 400; ohne `count` → max. 10; Response validiert gegen `trainingCaseSchema`.
- [ ] **Step 2:** `npx vitest run apps/api` → FAIL.
- [ ] **Step 3:** Implementieren.
- [ ] **Step 4:** `npm run lint && npm run typecheck && npm test` → PASS.
- [ ] **Step 5: Commit** `feat(api): case service, seeding and public training endpoint`

---

### Task 5: Seed-Fälle – Bestand überarbeiten und ergänzen

**Files:**
- Modify: `apps/api/src/seed/cases.ts`
- Test: `apps/api/src/seed/cases.test.ts`
- Quelle: `src/data/scenarios.js` (18 Altfälle; nach Task 6 nur noch über `git show 8054e85:src/data/scenarios.js` erreichbar)

**Interfaces:**
- Consumes: `SeedCase` (Task 4), `triage`, `caseInputSchema`.
- Produces: `export const SEED_CASES: SeedCase[]`.

Inhaltliche Vorgaben (fachliche Freigabe macht der Betreiber später im Editor):
- Alle 18 Altfälle übernehmen, `slug` = `legacy-<alte id>`, `expectedCategory` = alte `correctCategory`. Beschreibung und Begründung dürfen überarbeitet werden: Jede Beschreibung muss alle Befunde enthalten, die für die Schritte bis einschließlich des entscheidenden Schritts nötig sind; liegt Schritt B auf dem Weg, nennt sie die gezählte AF. Begründungen nennen den tatsächlich entscheidenden Schritt (Altfall 3: X/Tourniquet, nicht C).
- Mindestens 12 neue Fälle (`slug` `new-<kurzname>`), sodass insgesamt: jeder der 9 Schritte mindestens 2× entscheidend ist; mindestens 4 `yellow`-Fälle; mindestens 4 Kinder-Fälle; AF-Grenzwerte vorkommen (Erwachsene 9, 10, 30, 31; Kinder 14, 15, 40, 41 – je mindestens einmal); Fallen-Fälle mit gesetztem `focusFields` (z. B. gehfähig mit sichtbarer Verletzung, starke Blutung am Rumpf vs. Extremität, bewusstlos mit normaler AF).
- `tags` aus: `Kind`, `Brand`, `Verkehrsunfall`, `Sturz`, `Explosion`, `Massenpanik`, `Grenzwert`, `Falle`.
- Sachlicher, kurzer Stil wie die Altfälle; Deutsch.

- [ ] **Step 1: Failing Tests** (`cases.test.ts`):
  - Jeder Fall erfüllt `caseInputSchema`; alle `slug` eindeutig; `SEED_CASES.length >= 30`.
  - Für jeden Fall: `triage(findings).category === expectedCategory` (Fehlermeldung nennt `slug`).
  - Für jeden Fall, dessen `triage(...).path` `abnormalBreathingRate` enthält: `respiratoryRate !== null`.
  - Abdeckung: jeder `StepKey` ist ≥ 2× `decisiveStep`; ≥ 4× `yellow`; ≥ 4× `ageGroup 'child'`; AF-Werte 9, 10, 30, 31 (adult) und 14, 15, 40, 41 (child) kommen je vor.
  - Alle 18 `legacy-*`-Slugs vorhanden.
- [ ] **Step 2:** `npx vitest run apps/api/src/seed` → FAIL.
- [ ] **Step 3:** Fälle schreiben.
- [ ] **Step 4:** `npm run lint && npm run typecheck && npm test` → PASS.
- [ ] **Step 5: Commit** `feat(content): migrate and extend seed cases as findings`

---

### Task 6: Web-Gerüst, Design-Tokens, i18n und UI-Komponenten

**Files:**
- Create: `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/vite.config.ts`, `apps/web/index.html`, `apps/web/public/favicon.svg` (aus `public/`), `apps/web/src/main.tsx`, `apps/web/src/App.tsx`, `apps/web/src/routes.tsx`, `apps/web/src/styles.css`, `apps/web/src/i18n/index.ts`, `apps/web/src/i18n/de.ts`, `apps/web/src/lib/api.ts`, `apps/web/src/components/ui/{Button,Card,CategoryBadge,StepBadge,ProgressBar,BarrierTape,PatientBanner,Header,PrototypeModal}.tsx`, `apps/web/src/test/setup.ts`
- Delete: `index.html`, `src/`, `vite.config.js`, `postcss.config.js`, `tailwind.config.js`, `public/`
- Test: `apps/web/src/components/ui/ui.test.tsx`, `apps/web/src/lib/api.test.ts`

**Interfaces:**
- Consumes: `@manv/triage` (`Category`, `STEPS`).
- Produces:
  - Vite-Config: React-Plugin, `@tailwindcss/vite`, Dev-Proxy `/api` → `http://localhost:3001`, `define: { __APP_VERSION__: JSON.stringify(<root package.json version>) }`, Vitest-Umgebung `jsdom`.
  - `styles.css`: `@import "tailwindcss"`, `@fontsource/dm-sans`, `@theme` mit Tokens aus dem alten `src/index.css` als Tailwind-Farben (`sk1`, `sk2`, `white-tag`, `dead`, `bg`, `card`, `surface`, `elevated`, `text`, `muted`, `dim`, `accent`, `accent-muted`, `correct`, `wrong`, `border`, `border-light`), plus `.barrier-tape` und `.sticky-actions` aus dem Altbestand.
  - `i18n/de.ts`: alle Texte aus dem alten `src/i18n/de.js`, Platzhalter im i18next-Format `{{current}}`; Kategorien unter `categories.<id>.short|full`; Schritte unter `steps.<StepKey>.question|hint`; Version-Text nutzt `{{version}}`. Feature-Liste der Startseite nennt keine feste Fallanzahl.
  - `<Button variant="primary" | "secondary" | "yes" | "no" | "danger" …>` (natives button-Props-Passthrough), `<Card>`, `<CategoryBadge category: Category; size?: 'sm' | 'md' />`, `<StepBadge stepKey: StepKey />`, `<ProgressBar current total />`, `<BarrierTape showHint? />`, `<PatientBanner description label? />`, `<Header badge? title? subtitle? children? />`, `<PrototypeModal />` (Bestätigung in `localStorage` merken, Zugriff in try/catch; ohne Storage jedes Mal zeigen).
  - `class ApiError extends Error { status: number; body: unknown }`; `apiFetch<T>(path: string, init?: RequestInit): Promise<T>` (`credentials: 'include'`, JSON, wirft `ApiError` bei `!ok`, 204 → `undefined`).
  - `App.tsx`: `QueryClientProvider`, `RouterProvider`; `routes.tsx` vorerst nur `/` (Platzhalter-Startseite, Task 7 ersetzt).
  - `apps/web` Skripte: `dev`, `build`, `preview`, `typecheck`.

- [ ] **Step 1: Failing Tests:** `CategoryBadge category="red"` rendert „SK 1“, `"white"` rendert „PAK weiß“; `StepBadge stepKey="abnormalBreathingRate"` rendert „B“; `ProgressBar current={3} total={9}` hat `aria-valuenow=3`/`aria-valuemax=9`; `PrototypeModal` verschwindet nach Klick auf „Verstanden“ und bleibt nach erneutem Rendern weg; `apiFetch` wirft `ApiError` mit `status 400` und geparstem Body (fetch gemockt), liefert `undefined` bei 204.
- [ ] **Step 2:** `npx vitest run apps/web` → FAIL.
- [ ] **Step 3:** Implementieren; Altbestand löschen; ESLint-Ignore für `src/` entfernen.
- [ ] **Step 4:** `npm run lint && npm run typecheck && npm test && npm run build -w @manv/web` → PASS.
- [ ] **Step 5: Commit** `feat(web): vite/react/ts scaffold, design tokens, i18n and ui components`

---

### Task 7: Training ohne Konto

**Files:**
- Create: `apps/web/src/training/machine.ts`, `apps/web/src/training/useTrainingCases.ts`, `apps/web/src/training/TrainingRunner.tsx`, `apps/web/src/training/screens/{StartScreen,CaseIntro,StepScreen,CaseResult,Summary}.tsx`, `apps/web/src/training/TrainingPage.tsx`; Modify: `apps/web/src/routes.tsx`, `apps/web/src/i18n/de.ts`
- Test: `apps/web/src/training/machine.test.ts`, `apps/web/src/training/TrainingRunner.test.tsx`, `apps/web/src/training/TrainingPage.test.tsx`

**Interfaces:**
- Consumes: `gradeRun`, `STEPS`, `TrainingCase`, `GradeResult` (Task 1–2); `apiFetch`, UI-Komponenten (Task 6); Route `GET /api/training/cases` (Task 4).
- Produces:
  - `type TrainingState` mit `phase: 'intro' | 'step' | 'result' | 'summary'`, `cases: TrainingCase[]`, `caseIndex: number`, `answers: RunAnswer[]`, `results: { trainingCase: TrainingCase; grade: GradeResult }[]`.
  - `createTrainingState(cases: TrainingCase[]): TrainingState`; `trainingReducer(state, action)` mit Aktionen `{ type: 'begin' }`, `{ type: 'answer'; answer: boolean }`, `{ type: 'next' }`. Nach einem „Ja“ oder nach dem 9. „Nein“ ruft der Reducer `gradeRun` auf und wechselt zu `result`. Keine Fachlogik im Reducer außer dem Aufruf von `gradeRun`.
  - `<TrainingRunner cases: TrainingCase[]; mode: 'session' | 'preview'; onExit: () => void />` – im Modus `preview` endet der Durchlauf nach dem Ergebnis des einzigen Falls mit Button „Zurück zum Editor“ (ruft `onExit`), keine Zusammenfassung.
  - `useTrainingCases()` – TanStack Query, `GET /api/training/cases?count=10`, nur bei Start (kein Refetch on focus).
  - `TrainingPage` auf `/`: Startscreen → Laden → Runner → Zusammenfassung → „Nochmal üben“ (neue Fälle) / „Startseite“.
  - Ergebnis-Screen zeigt: eigene vs. richtige Kategorie, Begründung, Flatterband-Hinweis, Fehlerliste aus `stepResults` mit Texten für `missed` („übersehen“) und `overcalled` („fälschlich bejaht“) und Lernfeld.
  - Zusammenfassung: Trefferquote, Verteilung der richtigen Kategorien, Liste je Fall, Bewertungstexte wie im Altbestand (100 % / ≥ 75 % / ≥ 50 % / darunter).

- [ ] **Step 1: Failing Tests:**
  - `machine.test.ts`: Fall gehfähig; `begin`, `answer(false)`, `answer(true)` → `phase 'result'`, `results[0].grade.isCorrect true`; `next` auf letztem Fall → `phase 'summary'`; 9× `answer(false)` bei Default-Befunden → `result` mit `userCategory 'yellow'`; `answer` außerhalb von `step` ändert den State nicht.
  - `TrainingRunner.test.tsx`: mit 2 Fällen zeigt „Patient 1 von 2“; Durchklicken bis Zusammenfassung zeigt „1/2“ bzw. „2/2“; im `preview`-Modus ruft der Button nach dem Ergebnis `onExit` auf.
  - `TrainingPage.test.tsx` (fetch gemockt): Antwort `{cases: []}` → Meldung `t('training.noCases')` („Aktuell sind keine freigegebenen Fälle vorhanden.“), kein Runner; HTTP 500 → Fehlermeldung mit „Erneut versuchen“; 3 Fälle → „Patient 1 von 3“.
- [ ] **Step 2:** `npx vitest run apps/web` → FAIL.
- [ ] **Step 3:** Implementieren.
- [ ] **Step 4:** `npm run lint && npm run typecheck && npm test` → PASS. Manuell: dev-DB + `SEED_PUBLISH=true` API + `npm run dev -w @manv/web`, im Browser einen Durchgang auf 375 px Breite durchspielen.
- [ ] **Step 5: Commit** `feat(web): anonymous training flow on shared triage logic`

---

### Task 8: Docker, Compose, CI/CD und Betriebsdoku

**Files:**
- Create: `apps/api/Dockerfile`, `apps/web/Dockerfile`, `.dockerignore` (ersetzen), `deploy/docker-compose.yml`, `deploy/docker-compose.build.yml`, `deploy/nginx.conf`, `deploy/.env.example`, `deploy/README.md`, `.github/workflows/ci.yml`; Modify: `.github/workflows/deploy.yml`
- Delete: `Dockerfile`, `deploy/nginx-frontend.conf`

**Interfaces:**
- Consumes: `apps/api` Build (`dist/server.js`, `dist/cli.js`, Ordner `drizzle/`), `apps/web` Build (`dist/`).
- Produces:
  - API-Image: Build-Context = Repo-Root, Multi-Stage auf `node:24-alpine`, Laufzeit nur Prod-Abhängigkeiten von `@manv/api`, `dist/` + `drizzle/`, nicht-root User, `CMD ["node", "dist/server.js"]`, Healthcheck `wget -qO- http://localhost:3001/api/health`.
  - Web-Image: Vite-Build, `nginx:alpine`, `deploy/nginx.conf` (SPA-Fallback, `/assets/` 1 Jahr immutable, `location /api/` → `http://api:3001`, `client_max_body_size 1m`, Header `X-Forwarded-*` durchreichen).
  - `deploy/docker-compose.yml`: `name: manv-triage-app`; `web` (`ghcr.io/paullukashuber/manv-triage-simulator-web:${IMAGE_TAG:-latest}`, `127.0.0.1:3010:80`), `api` (`…-api:${IMAGE_TAG:-latest}`, Env `DATABASE_URL=postgres://manv:${POSTGRES_PASSWORD}@db:5432/manv`, `PUBLIC_URL`, `AUTH_SECRET`, `SEED_PUBLISH`, `depends_on db: service_healthy`), `db` (`postgres:17-alpine`, Volume `db_data`, Healthcheck `pg_isready`), `backup` (`postgres:17-alpine`, Shell-Schleife: täglich `pg_dump | gzip > /backups/manv-YYYY-MM-DD.sql.gz`, löscht Dateien älter 14 Tage, Volume `db_backups`). Alle `restart: unless-stopped`.
  - `deploy/docker-compose.build.yml`: Override mit `build:`-Kontexten für lokales Bauen.
  - `deploy/.env.example`: `POSTGRES_PASSWORD`, `AUTH_SECRET`, `PUBLIC_URL=https://triage.plhuber.de`, `SEED_PUBLISH=false`, `IMAGE_TAG=latest`.
  - `ci.yml`: auf `push` und `pull_request`: Node 24, `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
  - `deploy.yml`: auf `push` nach `main` + `workflow_dispatch`; Job `ci` (wiederverwendet `ci.yml` via `workflow_call`) → Build+Push beider Images (Tags `latest` + SHA) → `deploy/docker-compose.yml` per SCP nach `${{ vars.DEPLOY_PATH || '/opt/manv-triage-app' }}` → SSH `docker compose pull && docker compose up -d`. Secrets wie bisher (`SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`).
  - `deploy/README.md` (Deutsch): Ersteinrichtung (`/opt/manv-triage-app`, `.env`, `AUTH_SECRET` erzeugen mit `openssl rand -base64 48`), erster Admin per CLI (Befehl aus Task 9: `docker compose exec api node dist/cli.js create-admin --email … --name …`), Fälle im Editor freigeben, Host-nginx-Umstellung (Snippet: `location /` → `http://127.0.0.1:3010`, alte `/api/`- und `/admin`-Blöcke entfernen, `nginx -t && systemctl reload nginx`), danach alte `frontend`/`api`-Container in `/opt/manv-triage` stoppen (`docker compose stop frontend api`; Postgres/Redis/Authentik dort **nicht** stoppen), Backup-Wiederherstellung (`gunzip -c … | docker compose exec -T db psql -U manv manv`).

- [ ] **Step 1:** Dateien anlegen.
- [ ] **Step 2: Verifikation lokal:** `cp deploy/.env.example deploy/.env` mit Testwerten + `SEED_PUBLISH=true`; `docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.build.yml --env-file deploy/.env up -d --build`; `curl -s localhost:3010/api/health` → `{"status":"ok"}`; `curl -s 'localhost:3010/api/training/cases?count=3'` → 3 Fälle; `curl -s localhost:3010/` enthält `<div id="root">`; `docker compose … ps` zeigt alle 4 Dienste healthy/running; `docker compose … down -v`. `deploy/.env` ist in `.gitignore`.
- [ ] **Step 3:** `npm run lint && npm run typecheck && npm test` → PASS; `actionlint` falls verfügbar, sonst YAML-Syntax prüfen (`npx yaml-lint` o. ä.).
- [ ] **Step 4: Commit** `build: docker compose stack, ci and deploy workflows, ops runbook`

---

### Task 9: Authentifizierung, Rollen und Admin-CLI

**Files:**
- Create: `apps/api/src/auth/auth.ts`, `apps/api/src/auth/guards.ts`, `apps/api/src/auth/routes.ts`, `apps/api/src/db/auth-schema.ts`, `apps/api/src/cli.ts`, neue Migration in `apps/api/drizzle/`; Modify: `apps/api/src/db/schema.ts` (Re-Export, FK `cases.authorId`/`caseRevisions.publishedBy` → `user.id` on delete set null), `apps/api/src/app.ts`, `apps/api/tsup.config.ts`
- Test: `apps/api/src/auth/auth.test.ts`, `apps/api/src/cli.test.ts`

**Interfaces:**
- Consumes: `Db`, `Config`, `buildApp`.
- Produces:
  - `createAuth(deps: { db: Db; config: Config }): Auth` – better-auth mit Drizzle-Adapter (`provider: 'pg'`), `basePath: '/api/auth'`, `baseURL: config.publicUrl`, `secret: config.authSecret`, `emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 10 }`, `admin`-Plugin mit `defaultRole: 'trainee'`, `adminRoles: ['admin']`, Rollen `trainee | trainer | admin`; Session-Cookie `httpOnly`, `sameSite: 'lax'`, `secure` in production.
  - Fastify-Catch-all `/api/auth/*` → `auth.handler` (Fetch-Request/Response-Brücke).
  - `type SessionUser = { id: string; email: string; name: string; role: 'trainee' | 'trainer' | 'admin' }`; `getSessionUser(request: FastifyRequest): Promise<SessionUser | null>`; `requireRole(...roles: SessionUser['role'][]): preHandlerHookHandler` → 401 `{ error: 'unauthenticated' }` ohne Sitzung, 403 `{ error: 'forbidden' }` bei falscher Rolle; setzt `request.user`.
  - `buildApp` erhält `auth` intern über `createAuth`; `buildApp(deps)`-Signatur bleibt.
  - CLI (`node dist/cli.js <cmd>`): `create-admin --email --name [--password]`, `create-user --email --name --role trainee|trainer|admin [--password]`, `set-role --email --role`, `reset-password --email [--password]`. Ohne `--password` wird ein zufälliges 20-Zeichen-Passwort erzeugt und **einmal** ausgegeben. Funktioniert ohne Sitzung (über better-auth-Server-API bzw. internen Kontext). Exit-Code ≠ 0 mit Meldung bei unbekannter E-Mail oder doppelter E-Mail. Logik in exportierter Funktion `runCli(argv: string[], deps: { db: Db; config: Config; stdout: (s: string) => void }): Promise<number>`.

- [ ] **Step 1: Failing Tests** (PGlite, `app.inject`):
  - `POST /api/auth/sign-up/email` → abgelehnt (Registrierung aus).
  - Nach `runCli(['create-user', '--email', 't@example.test', '--name', 'T', '--role', 'trainer', '--password', 'correct-horse-1'])` → Exit 0; `POST /api/auth/sign-in/email` mit diesen Daten → 200 + Set-Cookie; `GET /api/auth/get-session` mit Cookie → `user.role === 'trainer'`.
  - Testroute mit `requireRole('trainer','admin')`: ohne Cookie 401 `{error:'unauthenticated'}`; mit `trainee`-Sitzung 403; mit `trainer` 200.
  - `runCli(['set-role', '--email', 'unknown@example.test', '--role', 'admin'])` → Exit ≠ 0. `create-admin` ohne `--password` gibt ein Passwort aus, mit dem Login funktioniert. `reset-password` ändert das Passwort (altes geht nicht mehr, neues schon).
- [ ] **Step 2:** `npx vitest run apps/api` → FAIL.
- [ ] **Step 3:** Auth-Schema generieren (better-auth CLI → `auth-schema.ts`), Migration mit `db:generate`, implementieren. `cli.ts` als zweiter tsup-Entry.
- [ ] **Step 4:** `npm run lint && npm run typecheck && npm test` → PASS.
- [ ] **Step 5: Commit** `feat(api): authentication with roles and admin cli`

---

### Task 10: Editor-API für Fälle

**Files:**
- Create: `apps/api/src/cases/editor-routes.ts`; Modify: `apps/api/src/cases/service.ts`, `apps/api/src/app.ts`, `packages/triage/src/case.ts` (Typen `CaseStatus`, `CaseDetail`, `CaseSummary`, `CaseFilter` + `caseFilterSchema` – geteilt mit dem Web)
- Test: `apps/api/src/cases/editor-routes.test.ts`, `apps/api/src/cases/service.test.ts` (ergänzen)

**Interfaces:**
- Consumes: `createCase`, `publishCase`, `ExpectedCategoryMismatchError` (Task 4), `requireRole`, `SessionUser` (Task 9), `caseInputSchema`.
- Produces (Service):
  - `type CaseDetail = { id; slug: string | null; description; reasoning; findings: Findings; expectedCategory: Category; focusFields: LearningField[]; tags: string[]; computedCategory: Category; decisiveStep: StepKey | null; status: 'draft' | 'published' | 'archived'; publishedRevisionNumber: number | null; hasUnpublishedChanges: boolean; createdAt: string; updatedAt: string }` – `hasUnpublishedChanges` = Fall hat Revision und `description`, `reasoning`, `findings`, `focusFields` oder `tags` weichen von ihr ab.
  - `type CaseSummary = Omit<CaseDetail, 'reasoning' | 'findings'>`
  - `type CaseFilter = { status?: CaseDetail['status']; category?: Category; decisiveStep?: StepKey | 'none'; tag?: string; q?: string }` (`q` = Teilstring in Beschreibung, case-insensitive)
  - `getCase(db, id): Promise<CaseDetail | null>`, `listCases(db, filter: CaseFilter): Promise<CaseSummary[]>` (sortiert nach `updatedAt` absteigend), `updateCase(db, id, input: CaseInput): Promise<CaseDetail>` (berechnet neu, Status unverändert), `duplicateCase(db, id, authorId): Promise<CaseDetail>` (neuer `draft`, `slug null`), `archiveCase(db, id)`, `restoreCase(db, id)` (→ `draft`), `deleteCase(db, id)` → wirft `CaseHasRevisionsError`, wenn `publishedRevisionId` gesetzt ist.
- Produces (Routen, alle mit `requireRole('trainer','admin')`, Präfix `/api/editor/cases`):
  - `GET /` (Query = `CaseFilter`) → `{ cases: CaseSummary[] }`
  - `GET /:id` → `CaseDetail` | 404
  - `POST /` (Body `CaseInput`) → 201 `CaseDetail`
  - `PUT /:id` → `CaseDetail`
  - `POST /:id/duplicate` → 201 `CaseDetail`
  - `POST /:id/publish` → `CaseDetail` | 422 `{ error: 'expected_category_mismatch', expected, computed }`
  - `POST /:id/archive`, `POST /:id/restore` → `CaseDetail`
  - `DELETE /:id` → 204 | 409 `{ error: 'case_has_revisions' }`
  - Validierungsfehler → 400 `{ error: 'validation', issues: [{ path: string, message: string }] }`; ungültige UUID → 404.

- [ ] **Step 1: Failing Tests** (Sitzungen per CLI-Helfer + Sign-in-Cookie):
  - Ohne Sitzung → 401 auf `GET /api/editor/cases`; `trainee` → 403.
  - `POST` mit `findings.respiratoryRate: 12.5` → 400 mit `issues[0].path === 'findings.respiratoryRate'`; mit unbekanntem Befund-Schlüssel → 400; nichts gespeichert (`GET /` leer).
  - Anlegen → `status 'draft'`, `computedCategory` korrekt, `publishedRevisionNumber null`.
  - Publish mit falscher Soll-Kategorie → 422 mit `expected`/`computed`.
  - Veröffentlichter Fall, dann `PUT` mit neuer Beschreibung → `hasUnpublishedChanges true`; `GET /api/training/cases` liefert weiterhin die **alte** Beschreibung; nach erneutem Publish die neue und `publishedRevisionNumber 2`.
  - `DELETE` auf veröffentlichtem Fall → 409; auf nie veröffentlichtem Entwurf → 204.
  - Archivieren → erscheint nicht mehr im Training; `restore` → `draft`.
  - Filter: `status=draft`, `category=red`, `decisiveStep=none` (nur `yellow`), `q` findet Teilstring.
  - `duplicate` → neuer Entwurf mit gleichen Befunden, anderer `id`.
- [ ] **Step 2:** `npx vitest run apps/api` → FAIL.
- [ ] **Step 3:** Implementieren.
- [ ] **Step 4:** `npm run lint && npm run typecheck && npm test` → PASS.
- [ ] **Step 5: Commit** `feat(api): trainer case editor endpoints with revisions`

---

### Task 11: Web – Login, geschützte Bereiche, Nutzerverwaltung

**Files:**
- Create: `apps/web/src/auth/auth-client.ts`, `apps/web/src/auth/RequireRole.tsx`, `apps/web/src/auth/LoginPage.tsx`, `apps/web/src/auth/UserMenu.tsx`, `apps/web/src/admin/UsersPage.tsx`; Modify: `apps/web/src/routes.tsx`, `apps/web/src/i18n/de.ts`, `apps/web/src/training/screens/StartScreen.tsx` (dezenter Link „Ausbilder-Login“ im Footer)
- Test: `apps/web/src/auth/RequireRole.test.tsx`, `apps/web/src/auth/LoginPage.test.tsx`, `apps/web/src/admin/UsersPage.test.tsx`

**Interfaces:**
- Consumes: better-auth-Endpunkte unter `/api/auth` inkl. Admin-Plugin (Task 9).
- Produces:
  - `authClient` = `createAuthClient({ basePath: '/api/auth', plugins: [adminClient()] })` aus `better-auth/react`; `useSession()`.
  - `<RequireRole roles={['trainer','admin']}>` – lädt Sitzung; ohne Sitzung `Navigate` zu `/login?redirect=<aktueller Pfad>`; falsche Rolle → Hinweisseite „Kein Zugriff“.
  - `LoginPage` (`/login`): E-Mail + Passwort, Fehlertext bei falschen Daten, nach Erfolg Weiterleitung auf `redirect` (nur relative Pfade, die mit `/` beginnen und nicht mit `//`; sonst `/editor`).
  - Routen: `/editor/*` in `RequireRole(['trainer','admin'])`, `/admin/users` in `RequireRole(['admin'])`. API-Aufrufe, die 401 liefern, invalidieren die Sitzung und führen zum Login.
  - `UsersPage`: Liste (Name, E-Mail, Rolle), „Ausbilder anlegen“ (Name, E-Mail, Startpasswort ≥ 10 Zeichen, Rolle), Rolle ändern, Passwort zurücksetzen – über `authClient.admin.*`.
  - `UserMenu` im Editor-Header: Name, Rolle, Link „Nutzer“ (nur Admin), „Abmelden“.

- [ ] **Step 1: Failing Tests** (authClient gemockt):
  - `RequireRole` ohne Sitzung leitet nach `/login?redirect=%2Feditor` um; mit `trainee` zeigt „Kein Zugriff“; mit `trainer` rendert Kinder.
  - `LoginPage`: Fehler vom Client → Fehlermeldung sichtbar; Erfolg mit `?redirect=/editor/cases/abc` → navigiert dorthin; `?redirect=//evil.example` → navigiert zu `/editor`.
  - `UsersPage`: rendert Nutzerliste; Formular mit 5-Zeichen-Passwort zeigt Validierungsfehler und ruft `createUser` nicht auf.
- [ ] **Step 2:** `npx vitest run apps/web` → FAIL.
- [ ] **Step 3:** Implementieren.
- [ ] **Step 4:** `npm run lint && npm run typecheck && npm test` → PASS.
- [ ] **Step 5: Commit** `feat(web): login, role-protected routes and user management`

---

### Task 12: Web – Fall-Editor mit Live-Vorschau

**Files:**
- Create: `apps/web/src/editor/api.ts`, `apps/web/src/editor/CaseListPage.tsx`, `apps/web/src/editor/CaseEditPage.tsx`, `apps/web/src/editor/CaseForm.tsx`, `apps/web/src/editor/TriagePreview.tsx`; Modify: `apps/web/src/routes.tsx`, `apps/web/src/i18n/de.ts`
- Test: `apps/web/src/editor/CaseForm.test.tsx`, `apps/web/src/editor/TriagePreview.test.tsx`, `apps/web/src/editor/CaseEditPage.test.tsx`, `apps/web/src/editor/CaseListPage.test.tsx`

**Interfaces:**
- Consumes: Editor-Routen + Typen `CaseDetail`, `CaseSummary`, `CaseFilter` aus `@manv/triage` (Task 10); `triage`, `caseInputSchema`, `defaultFindings` (Task 1–2); `TrainingRunner` mit `mode="preview"` (Task 7).
- Produces:
  - `editorApi`: `listCases(filter)`, `getCase(id)`, `createCase(input)`, `updateCase(id, input)`, `duplicateCase(id)`, `publishCase(id)`, `archiveCase(id)`, `restoreCase(id)`, `deleteCase(id)` + TanStack-Query-Hooks.
  - `CaseListPage` (`/editor`): Tabelle/Kartenliste mit Status-Chip, berechneter Kategorie, entscheidendem Schritt, Tags, „ungespeicherte Änderungen“-Hinweis; Filter (Status, Kategorie, entscheidender Schritt, Tag, Suche) im URL-Query; Button „Neuer Fall“.
  - `CaseForm` (`value: CaseInput; onChange(value: CaseInput); errors?: Record<string, string>`): Beschreibung, Befunde (Ja/Nein-Schalter je Befund in Algorithmus-Reihenfolge, Altersgruppe, AF-Zahlenfeld mit „leer = nicht angegeben“), Soll-Kategorie, Lernfeld-Fokus (Mehrfachauswahl), Tags, Begründung. Startwert für neue Fälle: `defaultFindings()`.
  - `TriagePreview` (`findings: Findings; expectedCategory: Category`): berechnete Kategorie (`CategoryBadge`), Weg durch den Algorithmus (jeder Schritt aus `triage().path` mit Ja/Nein, entscheidender hervorgehoben), Warnbox wenn Soll ≠ berechnet, Hinweis wenn `respiratoryRate === null` und `abnormalBreathingRate` im Pfad liegt.
  - `CaseEditPage` (`/editor/cases/new`, `/editor/cases/:id`): Formular + Vorschau nebeneinander (≥ 1024 px) bzw. untereinander; Speichern; Veröffentlichen (deaktiviert mit Begründung bei Soll ≠ berechnet oder ungespeicherten Formularänderungen); „Probe-Sichtung“ öffnet `TrainingRunner mode="preview"` mit dem aktuellen Formularstand; Duplizieren, Archivieren/Wiederherstellen, Löschen (nur Entwurf ohne Revision, mit Bestätigungsdialog); Warnung beim Verlassen mit ungespeicherten Änderungen; Server-Validierungsfehler (`issues`) werden den Feldern zugeordnet.

- [ ] **Step 1: Failing Tests:**
  - `TriagePreview`: Befund gehfähig + Soll `white` → zeigt „PAK weiß“, keine Warnung; Soll `red` → Warnung sichtbar; AF leer + Pfad bis B → AF-Hinweis sichtbar.
  - `CaseForm`: Umschalten „Gehfähig“ ruft `onChange` mit `findings.ambulatory true`; AF-Feld leeren → `respiratoryRate null`; Eingabe „34“ → `34`.
  - `CaseEditPage` (API gemockt): Publish-Button deaktiviert bei Soll ≠ berechnet; nach Speichern + Publish wird `publishCase` aufgerufen; 422-Antwort zeigt Fehlermeldung; 400 mit `issues[{path:'description'}]` zeigt Fehler am Beschreibungsfeld; „Probe-Sichtung“ zeigt „Patient 1 von 1“.
  - `CaseListPage`: Filter `status=draft` landet im URL-Query und im API-Aufruf; Fall mit `hasUnpublishedChanges` zeigt Hinweis.
- [ ] **Step 2:** `npx vitest run apps/web` → FAIL.
- [ ] **Step 3:** Implementieren.
- [ ] **Step 4:** `npm run lint && npm run typecheck && npm test` → PASS. Manuell: Stack mit `deploy/docker-compose.build.yml` hochfahren, Admin per CLI anlegen, einloggen, einen Seed-Entwurf prüfen und veröffentlichen, im anonymen Training erscheint er.
- [ ] **Step 5: Commit** `feat(web): case editor with live triage preview and trial run`

---

### Task 13: Dokumentation und Abschluss

**Files:**
- Modify: `README.md`, `CHANGELOG.md`, `CONTRIBUTING.md`
- Test: keiner (Doku); Verifikation über Gesamtlauf

- [ ] **Step 1:** `README.md` (Deutsch): neue Architektur, Tech-Stack-Tabelle, lokale Entwicklung (`docker compose -f deploy/docker-compose.dev.yml up -d db`, `cp apps/api/.env.example apps/api/.env`, `npm install`, `npm run dev`), Tests, Verweis auf `deploy/README.md`, Version 0.3.0, Roadmap aktualisieren (Fall-Editor ✓; Konten/Lernfelder = nächster Schritt), GitHub-Pages-Badge/Links entfernen.
- [ ] **Step 2:** `CHANGELOG.md`: Eintrag `[0.3.0] – 2026-11-16` mit Rewrite-Punkten; „Fall einreichen“ als entfernt nennen. `CONTRIBUTING.md`: Befehle an Monorepo anpassen.
- [ ] **Step 3:** Gesamtverifikation: `npm ci && npm run lint && npm run typecheck && npm test && npm run build` → PASS; Docker-Stack wie in Task 8 Step 2 → healthy.
- [ ] **Step 4: Commit** `docs: update readme, changelog and contributing for 0.3.0`
