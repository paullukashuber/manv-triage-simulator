# Betrieb: MANV-Sichtungssimulator

Der Stack läuft als eigenes Compose-Projekt `manv-triage-app` **neben** dem alten Simulator und Authentik.
Er hat ein eigenes Verzeichnis, eigene Volumes und lauscht nur auf `127.0.0.1:3010`.

| Dienst | Aufgabe |
|---|---|
| `web` | nginx, liefert die SPA aus und leitet `/api/` an `api` weiter (`127.0.0.1:3010`) |
| `api` | REST-API; führt beim Start Migrationen und Seed aus |
| `db` | PostgreSQL 17, Volume `db_data` |
| `backup` | tägliches `pg_dump` nach `/backups` (Volume `db_backups`), Aufbewahrung 14 Tage |

## Ersteinrichtung

1. Verzeichnis anlegen. `docker-compose.yml` und `.env.example` kopiert der Deploy-Workflow bei jedem Lauf
   automatisch hierher. Vor dem allerersten Start also einmal den Workflow laufen lassen oder beide Dateien
   aus `deploy/` im Repo von Hand kopieren:

   ```sh
   sudo mkdir -p /opt/manv-triage-app
   sudo chown "$USER" /opt/manv-triage-app
   cd /opt/manv-triage-app
   ```

2. `.env` anlegen und Werte setzen:

   ```sh
   cp .env.example .env
   chmod 600 .env
   openssl rand -hex 24      # Ausgabe als POSTGRES_PASSWORD eintragen
   openssl rand -base64 48   # Ausgabe als AUTH_SECRET eintragen
   ```

   `POSTGRES_PASSWORD` und `AUTH_SECRET` sind in der Vorlage leer. Solange sie leer sind, bricht jedes
   `docker compose`-Kommando absichtlich mit `POSTGRES_PASSWORD must be set in .env` bzw.
   `AUTH_SECRET must be set in .env` ab.

   | Variable | Bedeutung |
   |---|---|
   | `POSTGRES_PASSWORD` | Passwort der Datenbank, erzeugt mit `openssl rand -hex 24` (Hex, weil das Passwort in der `DATABASE_URL` steht; Base64 enthält Zeichen wie `/` und `+`, die die URL zerstören) |
   | `AUTH_SECRET` | mindestens 32 Zeichen, erzeugt mit `openssl rand -base64 48` |
   | `PUBLIC_URL` | `https://triage.plhuber.de` |
   | `SEED_PUBLISH` | `false` im Betrieb: Seed-Fälle bleiben Entwurf, bis sie im Editor freigegeben werden |
   | `IMAGE_TAG` | `latest` oder ein Commit-SHA, um eine bestimmte Version zu starten |

   Achtung: `POSTGRES_PASSWORD` wird nur beim ersten Anlegen des Datenbank-Volumes gesetzt. Eine spätere Änderung
   in `.env` ändert das Passwort in der bestehenden Datenbank **nicht**; dann schlägt die Anmeldung der API fehl.
   Das Passwort ließe sich dann nur in der Datenbank selbst ändern (`ALTER USER manv PASSWORD '…'`).

3. Starten:

   ```sh
   docker compose pull
   docker compose up -d
   docker compose ps
   curl -s http://127.0.0.1:3010/api/health   # {"status":"ok"}
   ```

Die Images liegen in der GitHub Container Registry. Sind sie privat, vorher einmal `docker login ghcr.io` auf dem Server ausführen.

## Ersten Admin anlegen

```sh
docker compose exec api node dist/cli.js create-admin --email admin@example.org --name "Vorname Nachname"
```

Ohne `--password` erzeugt der Befehl ein zufälliges Passwort und gibt es genau einmal aus – sofort notieren.
`--password …` ist möglich, landet aber in der Shell-History. `docker compose exec` will standardmäßig ein
Terminal; wer den Befehl ohne TTY absetzt (z. B. per `ssh user@server '…'` oder in einem Skript), nimmt
`docker compose exec -T`. Weitere Konten verwaltet der Admin danach in der Anwendung; ein vergessenes Passwort
setzt `node dist/cli.js reset-password --email …` zurück.

## Fälle freigeben

Die Seed-Fälle werden als Entwurf angelegt. Mit dem Admin-Konto anmelden, im Editor jeden Fall prüfen und
veröffentlichen. Erst veröffentlichte Revisionen erscheinen im Training.
Checkliste, Fallliste und fachliche Prüfhinweise: [docs/content/seed-cases-review.md](../docs/content/seed-cases-review.md).

## Host-nginx umstellen

TLS bleibt beim Host-nginx (Cloudflare-Zertifikat). Geändert wird **nur** der `server { … }`-Block mit
`server_name triage.plhuber.de;`. Der separate Block für `auth.plhuber.de` und die Authentik-Container bleiben
unverändert.

**Nicht entfernen:** Vor dem `server`-Block stehen auf Dateiebene `set_real_ip_from …;` für alle IPv4- und
IPv6-Bereiche von Cloudflare sowie `real_ip_header CF-Connecting-IP;`. Damit ist `$remote_addr` im Host-nginx die
echte Client-Adresse und nicht die eines Cloudflare-Knotens. Die API leitet daraus die Client-IP für das
Rate-Limit beim Login und die Sitzungsliste ab; ohne diese Zeilen landen alle Besucher in einem gemeinsamen
Rate-Limit-Topf, und ein einzelner Angreifer sperrt den Login für alle. Diese Zeilen bei der Umstellung stehen
lassen (und bei neuen Cloudflare-Bereichen nachpflegen).

1. Konfiguration sichern (Pfad an den Server anpassen):

   ```sh
   sudo cp /etc/nginx/sites-available/triage.plhuber.de /etc/nginx/sites-available/triage.plhuber.de.bak
   ```

2. Im `triage.plhuber.de`-Block alle bisherigen `location`-Blöcke entfernen, also `/api/`, `/api/admin/`,
   `/admin`, `/outpost.goauthentik.io` und `@authentik_login` samt der alten `location /`. Stattdessen genau
   ein Block:

   ```nginx
   location / {
       proxy_pass http://127.0.0.1:3010;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
   }
   ```

   `listen`, `server_name`, Zertifikate und sonstige Einstellungen des Blocks bleiben.

3. Authentik-Reste auf Server-Ebene des `triage.plhuber.de`-Blocks entfernen, falls vorhanden: alle Zeilen
   `auth_request …;`, `auth_request_set …;` und `error_page 401 = @authentik_login;` außerhalb der
   `location`-Blöcke. Sie verweisen auf die eben gelöschten Locations; `nginx -t` scheitert sonst an der
   fehlenden Location `@authentik_login`. Restliche Fundstellen mit Zeilennummer anzeigen:

   ```sh
   sudo grep -nE 'auth_request|authentik' /etc/nginx/sites-available/triage.plhuber.de
   ```

   Innerhalb des `triage.plhuber.de`-Blocks darf keine Fundstelle mehr liegen. Treffer im
   `auth.plhuber.de`-Block (falls er in derselben Datei steht) bleiben unverändert.

4. Prüfen und neu laden:

   ```sh
   sudo nginx -t && sudo systemctl reload nginx
   ```

5. Nach der Umstellung prüfen, dass die API echte Client-Adressen sieht: im Browser als Ausbilder anmelden,
   dann auf dem Server

   ```sh
   cd /opt/manv-triage-app
   docker compose exec db psql -U manv manv -c 'select ip_address, created_at from session order by created_at desc limit 5;'
   ```

   Die neueste Zeile muss die öffentliche IP des eigenen Anschlusses zeigen. Steht dort eine Cloudflare-Adresse
   oder eine `172.x`-Adresse, fehlen die `set_real_ip_from`/`real_ip_header`-Zeilen oder der `location`-Block
   setzt `X-Forwarded-For` nicht wie oben.

Zurückrollen: `.bak` zurückkopieren (`sudo cp …bak …`), dann `sudo nginx -t && sudo systemctl reload nginx`.
Der alte Stack läuft bis dahin weiter, sofern seine Container noch nicht gestoppt wurden.

## Alte Container stoppen

Erst wenn die neue Seite über `https://triage.plhuber.de` funktioniert:

```sh
cd /opt/manv-triage
docker compose stop frontend api
```

**Nicht** stoppen: Postgres, Redis und Authentik in diesem Projekt. Authentik nutzt den alten Postgres-Container.

## Updates

Jeder Push auf `main` startet den Workflow `Deploy to Server`: Tests, Images bauen und nach GHCR pushen,
`docker-compose.yml` und `.env.example` per SCP nach `/opt/manv-triage-app` (Repository-Variable `DEPLOY_PATH` überschreibt den Pfad)
kopieren, dann `docker compose pull && docker compose up -d --remove-orphans`.
Benötigte Secrets: `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`.

Manuell auf eine bestimmte Version zurück: `IMAGE_TAG=<commit-sha>` in `.env` setzen und `docker compose up -d`.

## Backups

Der Dienst `backup` erstellt ca. eine Minute nach dem Start und danach alle 24 Stunden
`/backups/manv-JJJJ-MM-TT.sql.gz` und löscht Dateien, die älter als 14 Tage sind.

```sh
docker compose exec backup ls -l /backups
```

### Wiederherstellen

Wichtig: `docker compose down -v` löscht **alle** Volumes des Projekts, auch `db_backups` mit den Sicherungen.
Im Betrieb niemals `down -v` verwenden.

Ein Dump enthält das komplette Schema und lässt sich nur in eine **leere** Datenbank einspielen (in eine bereits
migrierte Datenbank liefert er „already exists“- und Primärschlüssel-Fehler).

1. Dump zuerst aus dem Volume herauskopieren (Pflicht, bevor irgendetwas gelöscht wird):

   ```sh
   cd /opt/manv-triage-app
   docker compose exec backup ls /backups        # Dateinamen ansehen
   docker compose cp backup:/backups/manv-2026-01-31.sql.gz ./
   ```

2. Nur das Datenbank-Volume neu anlegen (die Backups bleiben erhalten):

   ```sh
   docker compose stop api db
   docker compose rm -f db
   docker volume rm manv-triage-app_db_data
   docker compose up -d db
   ```

3. Dump einspielen und danach die API starten:

   ```sh
   gunzip -c manv-2026-01-31.sql.gz | docker compose exec -T db psql -v ON_ERROR_STOP=1 -U manv manv
   docker compose up -d api
   ```

Alternative ohne Volume-Löschen: in der laufenden Datenbank das Schema leeren, dann Schritt 3 ausführen
(`docker compose stop api` vorher):

```sh
docker compose exec -T db psql -v ON_ERROR_STOP=1 -U manv manv \
  -c 'DROP SCHEMA public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;'
```

Die Backups liegen auf demselben Server wie die Datenbank; für echten Schutz die Dateien regelmäßig extern kopieren.
Ein Backup gilt nur dann als erfolgreich, wenn `pg_dump` ohne Fehler endet und die Datei nicht leer ist; sonst
steht `backup FAILED` im Log (`docker compose logs backup`).

## Lokal bauen und testen

```sh
cp deploy/.env.example deploy/.env   # Testwerte eintragen
docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.build.yml --env-file deploy/.env up -d --build
curl -s localhost:3010/api/health
docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.build.yml --env-file deploy/.env down -v
```
