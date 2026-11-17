# Offene Nacharbeiten aus dem Rewrite (Phase 1 + 2)

Stand: 2026-11-17. Gesammelt aus den Reviews der 13 Tasks und dem Abschluss-Review. Nichts davon ist ein
Sicherheits- oder Datenverlust-Problem; alles Kritische und Wichtige ist bereits behoben.

## Fachlich (bei der Freigabe im Editor prüfen)
- Bewusstlose Patienten in Rückenlage mit „atmet frei“ (`new-bewusstlos-normale-af`, `legacy-2`): Begründung sagt noch nicht, warum A nicht zutrifft.
- Altersgrenze Kind/Kleinkind für die AF-Grenzwerte bestätigen (`new-kind-af-14` hängt daran).
- Details: `docs/content/seed-cases-review.md`.

## Editor / Web
- Beschriftung der Befund-Schalter ist nicht klickbar (nur Ja/Nein und Schalter) – auf Touch unpraktisch.
- Strg/Cmd+S speichert auch ohne Änderungen; Fehlermeldung `case_archived` erscheint auch bei fehlgeschlagenem Speichern.
- Tag-/Suchfilter ohne Debounce (eine Anfrage pro Tastendruck).
- Wiederhergestellter Entwurf erkennt keine zwischenzeitlichen Änderungen anderer Ausbilder.
- Admin kann sich selbst die Admin-Rolle entziehen (per CLI `set-role` behebbar).
- Fehlschlag beim Session-Refetch nach Login zeigt „Anmeldung fehlgeschlagen“, obwohl angemeldet.
- `ConfirmDialog` macht den Hintergrund nicht `inert`; `PrototypeModal` ohne Escape/Fokus-Management.
- Web-Bundle 592 kB (Vite-Warnung) – Editor per Lazy-Loading abtrennen.

## API / Betrieb
- `listCases` ohne Pagination; Archivieren ist read-then-write (nicht atomar); paralleles Veröffentlichen kann an der Unique-Constraint mit 500 scheitern.
- CLI: `--password` ist in `ps` sichtbar; Fehler gehen nach stdout.
- `onnotice` unterdrückt auch Postgres-WARNINGs.
- Keine Security-Header, nginx im Web-Container läuft als root, Actions nur per Major-Tag gepinnt, CI läuft auf `main` doppelt.
- Clients aus privaten Netzen (LAN) landen im gemeinsamen Rate-Limit-Bucket.

## Tests / Wartung
- Grading: Tests für >9 Antworten, „Nein“ am entscheidenden Schritt mit späterem „Ja“, 9 Antworten mit „Ja“ am Ende.
- Seed: Tabelle „entscheidender Schritt je Fall“ als Test; `seed-cases-review.md` kann von `cases.ts` abweichen (kein Guard).
- Test-Fixtures liegen in `src/` (`apps/api/src/cases/fixtures.ts`, `apps/web/src/training/fixtures.ts`).
- Lücken: Editor Duplizieren/Archivieren/Wiederherstellen, `beforeunload`, Summary-Schwellen, PrototypeModal ohne Storage.

## Phase 3 (eigener Plan)
Konten für Teilnehmende, gespeicherte Durchgänge, Fortschritt, Lernfelder, gezieltes Üben, Konto löschen, SMTP.
Dabei: Antworten serverseitig mit zod validieren, bevor `gradeRun` sie bekommt.

## Betrieb: Abbau des alten Stacks
Der Abbau des alten Stacks in `/opt/manv-triage` inklusive Authentik (Archiv, `docker compose down`, `auth.plhuber.de` aus Host-nginx und Cloudflare-DNS entfernen, nach Wartezeit Volumes/Images/Verzeichnis löschen) ist ein Betreiber-Schritt auf dem Server, kein Workflow. Ablauf: `deploy/README.md`, Abschnitt „Alten Stack abbauen“.
