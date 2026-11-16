# ManV Triage Simulator – Rewrite (Design)

Stand: 2026-11-16 · Status: freigegeben

## 1. Absicht und Warum

Der Simulator (v0.2.2) ist ein reines React-Frontend: 18 Fälle stehen fest im Code, jeder Fall
enthält für alle 9 Sichtungsschritte die „richtige Antwort“ **und** zusätzlich die richtige
Kategorie. Beides kann sich widersprechen, nichts prüft es, und neue Fälle gehen nur per Code-Änderung.

Der Rewrite soll:

- **Fälle in eine Datenbank** bringen und über einen **Fall-Editor im Browser** pflegbar machen,
  damit der Betreiber (und später weitere Ausbilder) Fälle direkt ergänzen können.
- **Fälle nur noch als Befunde** des Patienten speichern. Die richtige Kategorie und der richtige
  Weg durch den Algorithmus werden **berechnet**. Die Sichtungslogik steht an genau einer Stelle
  und ist durch Tests abgesichert.
- Üben **ohne Konto** weiterhin ermöglichen, aber **mit Konto** echten Mehrwert bieten:
  gespeicherte Durchgänge, Fortschritt über die Zeit, **Lernfelder** (wo mache ich systematisch
  Fehler?) und gezielte Fallauswahl dafür.
- Den alten Code erneuern statt verschieben (TypeScript, Tests, saubere Komponenten).
- Den Betrieb über **Docker Compose** neu aufsetzen, mit Compose-Datei im Repo.

## 2. Ziele, Nicht-Ziele, Anti-Ziele

**Ziele**
- Gleiche Sichtungslogik wie heute (VOR-Sichtung, Algorithmus Region Hannover), aber berechnet aus Befunden.
- Anonymes Training wie heute; Training mit Konto inkl. Fortschritt und Lernfeldern.
- Fall-Editor für Ausbilder mit Live-Vorschau der berechneten Kategorie und Entwurf/Veröffentlicht-Status.
- Alle 18 bestehenden Fälle werden übernommen (überarbeitet) und um neue Fälle ergänzt; der Betreiber gibt sie im Editor frei.
- Ein Repo, ein `docker compose up` startet alles; CI baut, testet und deployt.

**Nicht-Ziele (vorerst)**
- Gruppen/Kurse, in denen Ausbilder Ergebnisse ihrer Teilnehmenden sehen (kommt später; Datenmodell bleibt dafür offen, siehe 6.4).
- Weitere Algorithmen/Regionen, „vollständige Sichtung“ (ABCDE mit LSM), ManV-Lage mit Zeitdruck (Roadmap, nicht Teil dieses Rewrites).
- Englische Übersetzung (i18n wird aber echt vorbereitet).
- Die alte Funktion „Fall einreichen“ (öffentliche Einreichung + Prüfung) entfällt; alte Einreichungen werden nicht übernommen.
- Anbindung an Authentik (siehe 13).
- PWA/Offline.

**Anti-Ziele (wäre ein Fehlschlag, selbst wenn es technisch läuft)**
- Die Sichtungslogik existiert an mehr als einer Stelle oder in mehr als einer Sprache.
- Ein Fall kann veröffentlicht werden, dessen hinterlegte Begründung nicht zur berechneten Kategorie passt, ohne dass der Ausbilder es sieht.
- Üben ohne Konto wird umständlicher als heute (z. B. Login-Wand, Cookie-Banner vor dem ersten Fall).
- Ausbilder sehen personenbezogene Ergebnisse anderer Nutzer (gehört erst zu den Gruppen, mit Einwilligung).

## 3. Rahmenbedingungen

- Betrieb auf eigenem Server (heute `/opt/manv-triage`, Deploy per GitHub Actions → GHCR → SSH → `docker compose`).
- Zielgruppe: Helfer in Sanitäts-/Rettungsdienst, überwiegend **mobil** – Mobile-First bleibt.
- Personenbezogene Daten (Konten, Ergebnisse) → DSGVO: Datensparsamkeit, Konto löschbar, keine Tracker.
- Fachliche Inhalte sind weiterhin „Prototyp“ – der Hinweis im UI bleibt.

## 4. Ansätze (entschieden)

| Ansatz | Kurz | Abwägung |
|---|---|---|
| **A – TypeScript-Monorepo** (gewählt) | React + Fastify + PostgreSQL, Algorithmus als gemeinsames Paket | Eine Sprache, Logik nur einmal, Postgres trägt Auswertungen. Login/Rollen/Admin selbst bauen. |
| B – PocketBase + React | Fertiges Backend mit Auth & Admin-UI | Wenig Code, aber generische Admin-UI ohne Live-Vorschau, Algorithmus doppelt (Hook), Auswertungen umständlicher. |
| C – FastAPI (Python) + Postgres + React | Python-Backend | Algorithmus in zwei Sprachen – widerspricht dem Kernziel. |

**Gewählt: A** – vom Betreiber entschieden, weil nur so die Sichtungslogik an genau einer Stelle steht.

## 5. Architektur

### 5.1 Repo-Struktur (npm workspaces)

```
apps/
  web/        React 19 + Vite + TypeScript + Tailwind 4 (Training, Konto, Editor)
  api/        Fastify + TypeScript, Drizzle ORM, better-auth
packages/
  triage/     Sichtungsalgorithmus, Typen, Validierung (zod) – keine Abhängigkeit zu React/Node-APIs
deploy/
  docker-compose.yml, nginx.conf, .env.example
docs/
```

### 5.2 Dienste (Docker Compose)

| Dienst | Image | Aufgabe |
|---|---|---|
| `web` | nginx | liefert die gebaute SPA aus, leitet `/api/*` an `api` weiter |
| `api` | node:22-alpine | REST-API, Auth, führt beim Start DB-Migrationen aus |
| `db` | postgres:17 | Daten, benanntes Volume |
| `backup` | postgres:17 + cron | tägliches `pg_dump` in ein Volume, Aufbewahrung 14 Tage *(eigene Entscheidung)* |

Konfiguration über `.env` auf dem Server (DB-Passwort, Auth-Secret, öffentliche URL, optional SMTP).

**Neben dem alten Stack, nicht an seiner Stelle.** Auf dem Server laufen heute der alte Simulator und
Authentik (`auth.plhuber.de`); Authentik legt seine Datenbank in den **alten** Postgres-Container.
Der neue Stack bekommt deshalb ein eigenes Verzeichnis, einen eigenen Compose-Projektnamen
(`manv-triage-app`), ein eigenes Postgres-Volume und eigene Ports. Der alte Postgres, Redis und Authentik
werden nicht angefasst.

TLS terminiert vor `web`: Der Host-nginx mit Cloudflare-Zertifikat bleibt. `web` lauscht auf
`127.0.0.1:3010` und leitet `/api` selbst weiter. Zur Umschaltung zeigt der Host-nginx für
`triage.plhuber.de` nur noch mit `location /` auf `:3010`; die alten `/api/`- und `/admin`-Blöcke
entfallen. Das ist ein einmaliger manueller Schritt auf dem Server (siehe 13), ebenso das spätere
Stoppen der alten `frontend`- und `api`-Container.

### 5.3 CI/CD

- Bei jedem Push/PR: `lint`, `typecheck`, `test` (inkl. Algorithmus-Tests).
- Auf `main`: zwei Images (`web`, `api`) nach GHCR mit Tags `latest` + Commit-SHA, dann per SSH
  `docker compose pull && docker compose up -d` im Server-Verzeichnis. Die Compose-Datei kommt aus dem Repo.

## 6. Fachliches Modell

### 6.1 Befunde statt Antworten

Ein Fall speichert die **Befunde** (was ein Helfer am Patienten feststellen würde):

| Befund | Typ | Algorithmus-Schritt |
|---|---|---|
| `lifeThreateningExtremityBleeding` | bool | X – Tourniquet |
| `ambulatory` | bool | Gehfähig |
| `definiteDeathSigns` | bool | Todeszeichen |
| `inhalationTraumaStridor` | bool | A – Stridor |
| `airwayNeedsManagement` | bool | A – Atemweg offenhalten |
| `ageGroup` | `adult` \| `child` | B – bestimmt Grenzwerte |
| `respiratoryRate` | Zahl (/min) oder leer | B – pathologisch, wenn Erwachsene < 10 oder > 30, Kinder < 15 oder > 40; leer = nicht angegeben, gilt als unauffällig |
| `lifeThreateningBleeding` | bool | C – Blutung |
| `radialPulsePalpable` | bool | C – Radialispuls |
| `respondsPurposefully` | bool | D – gezielte Reaktion auf Ansprache |

*(Eigene Entscheidung:)* Die Atemfrequenz wird als **Zahl** gespeichert, nicht als „pathologisch ja/nein“.
So entscheidet der Algorithmus über die Grenzwerte, und die Fallbeschreibung kann die gezählte AF
nennen, ohne dass ein Widerspruch entstehen kann. Alle anderen Befunde bleiben Ja/Nein, wie die Schritte heute.

*(Eigene Entscheidung:)* Alle Ja/Nein-Befunde sind immer gesetzt (Standard: Nein/unauffällig), auch nach dem
entscheidenden Schritt. Wer dort fälschlich weitergeht, wird an den späteren Schritten gegen diese Werte bewertet.
Der Editor zeigt einen Hinweis, wenn die AF leer ist und der Schritt B auf dem richtigen Weg liegt.

**Soll-Kategorie** *(eigene Entscheidung)*: Der Autor gibt zusätzlich an, welche Kategorie er erwartet.
Weicht sie von der berechneten ab, zeigt der Editor das deutlich und **Veröffentlichen ist gesperrt**.
Das ist nur eine Prüfung, keine zweite Wahrheit – bewertet wird immer gegen die berechnete Kategorie.
Bei den 18 Bestandsfällen wird die alte `correctCategory` zur Soll-Kategorie.

**Lernfeld-Fokus** *(eigene Entscheidung)*: Optional markiert der Autor, welche Lernfelder der Fall gezielt
prüft (z. B. Fall 9: gehfähig trotz blutender Stirnwunde → Fokus „Gehfähigkeit“). Ohne Markierung zählt der
entscheidende Schritt.

Zusätzlich hat ein Fall: Fallbeschreibung (Freitext, was der Helfer sieht/hört), Begründung (Freitext),
optionale Tags (z. B. „Kind“, „Brand“, „Verkehrsunfall“), Status (`draft` | `published` | `archived`), Autor, Zeitstempel.

### 6.2 Algorithmus (`packages/triage`)

Reihenfolge und Ergebnisse wie heute (`src/data/triageSteps.js`):
X → Gehfähig → Todeszeichen → A (Stridor) → A (Atemweg) → B (AF) → C (Blutung) → C (Radialispuls) → D.
Erster zutreffender Schritt beendet die Sichtung: X/A/B/C/D → **SK 1**, Gehfähig → **PAK weiß**,
Todeszeichen → **Tot**. Trifft nichts zu → **SK 2**.

Öffentliche Funktionen (Namen sind Vorschlag des Designs):
- `evaluateStep(stepKey, findings) → boolean` – trifft dieser Schritt zu?
- `triage(findings) → { category, decisiveStep, path[] }` – berechnetes Ergebnis inkl. Weg.
- `gradeRun(findings, userAnswers[]) → { userCategory, correctCategory, isCorrect, stepErrors[] }` – bewertet einen Durchgang
  (für jeden vom Nutzer beantworteten Schritt: richtig/falsch; plus ob er zu früh gestoppt oder den
  entscheidenden Schritt übergangen hat).
- Schritt-Metadaten (Badge, Lernfeld-Zuordnung) und i18n-Schlüssel.

Tests: jeder Schritt einzeln, Grenzwerte der AF (9/10/30/31, Kind 14/15/40/41), Reihenfolge
(z. B. gehfähig **und** Todeszeichen ist unmöglich, aber X schlägt Gehfähig), und alle 18 Bestandsfälle
müssen die bisherige `correctCategory` ergeben.

Das Paket ist **versioniert** (`algorithmVersion`); gespeicherte Durchgänge merken sich die Version.

### 6.3 Lernfelder

Lernfelder = die Algorithmus-Schritte, gruppiert: **X**, **Gehfähigkeit**, **Todeszeichen**, **A**, **B**, **C**, **D**.
Für Nutzer mit Konto wird je Lernfeld gezählt, wie oft der Schritt bewertet wurde und wie oft falsch
(getrennt: „übersehen“ = Befund lag vor, Nutzer sagte Nein; „überbewertet“ = Nutzer sagte Ja ohne Befund).
Anzeige als Stärken/Schwächen. **Gezieltes Üben**: Fallauswahl gewichtet nach schwachen Lernfeldern
(Fälle, deren entscheidender Schritt im schwachen Lernfeld liegt oder die dieses Lernfeld als Fokus markiert haben).

### 6.4 Datenmodell (PostgreSQL, Auszug)

- `users` (better-auth-Tabellen + `role`: `trainee` | `trainer` | `admin`)
- `cases` (Arbeitsstand: id, description, reasoning, findings JSONB – validiert per zod aus `packages/triage`,
  expected_category, focus_fields[], `computed_category`, `decisive_step` (beim Speichern berechnet), status, tags[],
  author_id, published_revision_id, timestamps)
- `case_revisions` (unveränderlicher Snapshot bei jeder Veröffentlichung). **Training liest immer aus den
  veröffentlichten Revisionen**; Änderungen an einem veröffentlichten Fall sind erst nach erneutem Veröffentlichen sichtbar.
- `training_sessions` (id, user_id, started_at, finished_at, mode: `random` | `focused`)
- `attempts` (session_id, case_revision_id, answers JSONB, user_category, correct_category, is_correct, algorithm_version)
- `attempt_step_results` (attempt_id, step_key, learning_field, user_answer, correct_answer) – Basis für Lernfelder

Vorbereitet für später, aber **nicht gebaut**: `groups`, `group_members` (mit Einwilligungs-Zeitstempel).

## 7. Funktionen nach Rolle

### 7.1 Ohne Konto
- Training wie heute: 10 zufällige veröffentlichte Fälle, Schritt für Schritt, Feedback nach jedem Fall, Auswertung am Ende.
- Bewertung läuft im Browser über `packages/triage`; nichts wird gespeichert.
- Am Ende ein dezenter Hinweis: „Mit Konto Fortschritt speichern“.

### 7.2 Mit Konto (Teilnehmende)
- Registrierung/Login mit E-Mail + Passwort.
- Jeder Durchgang wird gespeichert. Der Server **bewertet selbst nach** (Client schickt nur Antworten).
- Seiten: Übersicht (letzte Durchgänge, Trefferquote über Zeit), Lernfelder, „Gezielt üben“.
- Konto und alle Daten selbst löschbar.

### 7.3 Ausbilder (`trainer`)
- Fall-Editor: Liste mit Filter (Status, Kategorie, entscheidender Schritt, Tags), Fall anlegen/bearbeiten/duplizieren.
- Formular für Befunde, rechts/unten **Live-Vorschau**: berechnete Kategorie + Weg durch den Algorithmus,
  und eine „Probe-Sichtung“, wie Teilnehmende den Fall sehen.
- Entwurf ↔ Veröffentlicht. Veröffentlichen erzeugt eine Revision; der Editor zeigt „ungespeicherte Änderungen
  gegenüber der veröffentlichten Fassung“.
- *(Eigene Entscheidung:)* Alle Ausbilder dürfen alle Fälle bearbeiten (kleines Team). Fälle mit Durchgängen werden
  nicht gelöscht, sondern archiviert; nur nie veröffentlichte Entwürfe sind löschbar.
- Ausbilder sehen **keine** Ergebnisse anderer Nutzer.

### 7.4 Admin
- Rollen vergeben (Teilnehmende zu Ausbildern machen). Erster Admin wird per CLI-Befehl im `api`-Container angelegt.

## 8. Frontend

- React 19, TypeScript, Vite, Tailwind 4, React Router, TanStack Query für API-Zugriffe.
- Bestehende Optik (dunkles Theme, Triage-Farben, Mobile-First, sticky Buttons) bleibt als Ausgangspunkt;
  wiederkehrende Elemente werden echte Komponenten (`Button`, `Card`, `CategoryBadge`, …).
- Training-State als reine, getestete Zustandsmaschine (Reducer ohne Fachlogik – die kommt aus `packages/triage`).
- i18n über eine kleine Bibliothek (z. B. `i18next`) statt direktem Import von `de`; Strings mit Platzhaltern.
- Editor ist für Desktop optimiert, muss mobil aber benutzbar sein.
- Versionsnummer nur an einer Stelle (aus `package.json` zur Build-Zeit).

## 9. Migration

- Die 18 Fälle aus `src/data/scenarios.js` werden in Befunde übersetzt und dabei fachlich überarbeitet
  (fehlende Angaben wie AF ergänzt, Widersprüche wie Fall 3 bereinigt). Dazu kommen neue Fälle, sodass jedes
  Lernfeld abgedeckt ist, inkl. Kinder und AF-Grenzwerte. Alles liegt als Seed-Datei im Repo.
- Seed-Fälle werden beim ersten Start mit Status **`draft`** importiert. Der Betreiber prüft und
  veröffentlicht sie im Editor. Ein Test stellt sicher, dass jeder Seed-Fall seine Soll-Kategorie ergibt.
- Für lokale Entwicklung kann der Seed alle Fälle direkt veröffentlichen (`SEED_PUBLISH=true`).
- Der alte Code wird ersetzt, nicht parallel betrieben.

## 10. Umsetzungsreihenfolge

1. **Fundament**: Monorepo, `packages/triage` + Tests, DB-Schema + Migrationen, Seed-Fälle, öffentliche
   Fall-API, neues Training ohne Konto, Docker Compose + CI/CD.
2. **Ausbilder & Fall-Editor**: Auth, Rollen, Admin-CLI, Editor mit Live-Vorschau, Entwurf/Veröffentlicht, Revisionen.
   *Erst danach Umschaltung von `triage.plhuber.de`* – vorher gäbe es keine freigegebenen Fälle.
3. **Konten für Teilnehmende** *(eigener Plan nach 1–2)*: Registrierung, gespeicherte Durchgänge, Fortschritt, Lernfelder, gezieltes Üben, Konto löschen.
4. *(Später)* Gruppen/Kurse.

## 11. Dem Bauenden überlassen

- Konkrete Bibliotheksversionen, Ordnerstruktur innerhalb der Apps, Styling-Details.
- API-Routen-Namen und Fehlerformat (REST, JSON, zod-validiert).
- Ob Drizzle-Migrationen als eigener Startschritt oder im `api`-Entrypoint laufen.

## 12. Eigene Entscheidungen (zur Prüfung durch den Betreiber)

- Atemfrequenz als Zahl + Altersgruppe statt „pathologisch ja/nein“.
- Rollen `trainee` / `trainer` / `admin`; Ausbilder werden vom Admin ernannt, nicht selbst registriert.
- Server bewertet Durchgänge mit Konto selbst nach; anonyme Bewertung nur im Browser.
- Fall-Revisionen bei Veröffentlichung; Training sieht nur veröffentlichte Revisionen.
- Soll-Kategorie als Veröffentlichungs-Sperre; Lernfeld-Fokus pro Fall.
- AF darf leer sein (= unauffällig); Ja/Nein-Befunde sind immer gesetzt.
- Alle Ausbilder bearbeiten alle Fälle; archivieren statt löschen.
- Täglicher DB-Backup-Container.
- TanStack Query, React Router, i18next, better-auth, Drizzle.

## 13. Antworten des Betreibers und Folgen

- **Authentik und der alte Simulator laufen noch.** → Neuer Stack läuft daneben (5.2).
  *(Eigene Entscheidung:)* Die App nutzt **eigene Konten** (better-auth) statt Authentik: Teilnehmende sollen sich
  selbst in der App registrieren, und ein zweites Login-System nur für Ausbilder lohnt nicht. Eine spätere
  Anmeldung über Authentik (OIDC) bleibt möglich.
- **„Fall einreichen“ entfällt**, alte Einreichungen werden nicht übernommen.
- **Kein Mailserver vorhanden.** → *(Eigene Entscheidung:)* SMTP ist optional per `.env`. Ohne SMTP: keine
  E-Mail-Bestätigung, Passwort-Reset nur durch Admin per CLI. Für Phase 3 (Selbstregistrierung) wird ein
  Mailversand empfohlen, am einfachsten ein externer SMTP-Relay-Dienst; die Einrichtung macht der Betreiber.
- **Fälle darf Claude überarbeiten und ergänzen, Freigabe durch den Betreiber im Editor.** → Seed als `draft` (9).

**Manuelle Schritte auf dem Server (Betreiber):** Verzeichnis + `.env` für `manv-triage-app` anlegen,
ersten Admin per CLI anlegen, Fälle freigeben, Host-nginx auf `:3010` umstellen, alte Container stoppen.
