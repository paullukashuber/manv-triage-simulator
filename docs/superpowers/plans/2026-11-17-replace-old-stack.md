# Ablösung des alten Stacks (inkl. Authentik) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Betriebsdoku so anpassen, dass der neue Stack den alten auf dem Server vollständig ablöst – inklusive Abbau von Authentik.

**Architecture:** Keine Code-Änderung. Neuer Stack bleibt in `/opt/manv-triage-app` (Port `127.0.0.1:3010`); Runbook bekommt nach der nginx-Umschaltung einen geordneten Abbau des alten Stacks in `/opt/manv-triage`.

**Tech Stack:** Docker Compose, nginx (Host), Cloudflare DNS, Markdown.

**Spec:** `docs/superpowers/specs/2026-11-16-triage-simulator-rewrite-design.md` (Abschnitte 2, 5.2, 13 – Stand 2026-11-17)

## Global Constraints

- Sprache der Doku: Deutsch. Befehle kopierbar, je ein Codeblock.
- Altes Projekt `/opt/manv-triage` hatte die Dienste `frontend` (127.0.0.1:3000), `api` (127.0.0.1:3001), `postgres` (postgres:16-alpine, Volume `postgres_data`, enthält die DBs des alten Simulators und `authentik`), `redis` (Volume `redis_data`), `authentik-server` (127.0.0.1:9000), `authentik-worker`. Host-nginx-Datei `/etc/nginx/sites-available/manv-triage` enthält Blöcke für `triage.plhuber.de` und `auth.plhuber.de` plus dateiweite Cloudflare-`set_real_ip_from`/`real_ip_header CF-Connecting-IP`-Zeilen.
- Die Cloudflare-Real-IP-Zeilen bleiben erhalten (Rate-Limiting der API hängt daran).
- Nichts wird gelöscht, bevor eine Archivsicherung des alten Postgres existiert und der neue Stack nachweislich läuft. Volumes/Images/Verzeichnis erst nach einer Wartezeit (Empfehlung: 2 Wochen) löschen.
- Neuer Stack, Ports, Compose-Datei und Workflows bleiben unverändert.

## Review Focus

- Reihenfolge: Ein Leser, der die Schritte stur von oben nach unten ausführt, darf zu keinem Zeitpunkt ohne laufende Seite oder ohne Rollback-Möglichkeit dastehen.
- `docker compose down` im alten Verzeichnis ohne `-v` (Volumes bleiben bis zur Wartezeit).
- `nginx -t` vor jedem Reload; nach Entfernen des `auth.plhuber.de`-Blocks darf keine Referenz (z. B. `proxy_pass http://127.0.0.1:9000`) übrig bleiben.

---

### Task 1: Runbook und Doku auf vollständige Ablösung umstellen

**Files:**
- Modify: `deploy/README.md`, `README.md` (nur falls dort auf „neben dem alten Stack“/Authentik verwiesen wird), `docs/superpowers/plans/2026-11-17-rewrite-followups.md` (Hinweis ergänzen, dass der Abbau des alten Stacks ein Betreiber-Schritt ist)

- [ ] **Step 1:** `deploy/README.md` Einleitung: statt „läuft neben dem alten Simulator und Authentik“ → „löst den alten Stack in `/opt/manv-triage` ab; er wird zuerst daneben hochgefahren und geprüft, danach wird der alte Stack inkl. Authentik abgebaut“.
- [ ] **Step 2:** Abschnitt Host-nginx: Hinweis, dass der `auth.plhuber.de`-Block **jetzt nicht** angefasst wird (er wird im Abbau-Abschnitt entfernt) – ersetzt den Satz „bleiben unverändert“. Übrige Schritte (Backup der Datei, Ersetzen der Locations, Authentik-Zeilen im `triage`-Block, `nginx -t`, Reload, Rollback, Prüfung der Client-IPs) bleiben.
- [ ] **Step 3:** Abschnitt „Alte Container stoppen“ ersetzen durch „Alten Stack abbauen“ mit nummerierten Schritten:
  1. Voraussetzung: neue Seite läuft seit der Umschaltung fehlerfrei, Admin-Login geht.
  2. Archiv des alten Postgres (alle DBs inkl. `authentik`): `cd /opt/manv-triage && docker compose exec -T postgres pg_dumpall -U "$POSTGRES_USER" | gzip > ~/manv-triage-alt-$(date +%F).sql.gz` – mit Hinweis, `POSTGRES_USER` aus `/opt/manv-triage/.env` zu nehmen (z. B. `set -a; . ./.env; set +a`), und Prüfung, dass die Datei nicht leer ist (`gunzip -c … | head`).
  3. Alten Stack stoppen und Container entfernen, Volumes behalten: `docker compose down` (ohne `-v`) in `/opt/manv-triage`; prüfen mit `docker ps`, dass nur noch `manv-triage-app-*` läuft.
  4. Host-nginx: `auth.plhuber.de`-Server-Block(s) (443 und 80-Redirect) aus der Site-Datei entfernen, Datei vorher sichern, `grep -nE '9000|authentik|auth\.plhuber' …` muss leer sein, `nginx -t`, reload. Cloudflare-Real-IP-Zeilen bleiben.
  5. DNS: Eintrag `auth.plhuber.de` in Cloudflare löschen (manuell im Dashboard).
  6. Rollback bis hierhin: `docker compose up -d` in `/opt/manv-triage` + gesicherte nginx-Datei zurück.
  7. Nach der Wartezeit endgültig aufräumen: `docker volume rm` der alten Volumes (Namen per `docker volume ls | grep manv-triage_` ermitteln – nicht `manv-triage-app_*`!), alte Images (`docker image ls | grep -E 'manv-triage-simulator:|goauthentik|redis'`, nur die nicht mehr genutzten entfernen), `/opt/manv-triage` löschen, Archivdatei sicher ablegen (enthält Authentik-Nutzerdaten – nach Wartezeit ebenfalls löschen, DSGVO).
- [ ] **Step 4:** Prüfen, dass in `deploy/README.md` keine Aussage mehr übrig ist, Authentik/Postgres/Redis des alten Projekts müssten weiterlaufen (`git grep -n -i authentik`).
- [ ] **Step 5:** `npm run lint && npm run typecheck && npm test` (unverändert grün, nur Doku).
- [ ] **Step 6: Commit** `docs(deploy): replace old stack incl. authentik after cutover`
