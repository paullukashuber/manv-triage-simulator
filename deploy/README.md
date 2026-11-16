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

1. Verzeichnis anlegen und die Compose-Datei ablegen (das Deploy-Skript kopiert sie später automatisch):

   ```sh
   sudo mkdir -p /opt/manv-triage-app
   sudo chown "$USER" /opt/manv-triage-app
   cd /opt/manv-triage-app
   # docker-compose.yml aus deploy/ im Repo hierher kopieren
   ```

2. `.env` anlegen (Vorlage: `deploy/.env.example`):

   ```sh
   cp .env.example .env   # oder die Datei von Hand anlegen
   openssl rand -base64 48   # Ausgabe als AUTH_SECRET eintragen
   ```

   | Variable | Bedeutung |
   |---|---|
   | `POSTGRES_PASSWORD` | Passwort der Datenbank (frei wählen, lang und zufällig) |
   | `AUTH_SECRET` | mindestens 32 Zeichen, erzeugt mit `openssl rand -base64 48` |
   | `PUBLIC_URL` | `https://triage.plhuber.de` |
   | `SEED_PUBLISH` | `false` im Betrieb: Seed-Fälle bleiben Entwurf, bis sie im Editor freigegeben werden |
   | `IMAGE_TAG` | `latest` oder ein Commit-SHA, um eine bestimmte Version zu starten |

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

Das Passwort wird interaktiv abgefragt. Weitere Konten verwaltet der Admin danach in der Anwendung.

## Fälle freigeben

Die Seed-Fälle werden als Entwurf angelegt. Mit dem Admin-Konto anmelden, im Editor jeden Fall prüfen und
veröffentlichen. Erst veröffentlichte Revisionen erscheinen im Training.

## Host-nginx umstellen

TLS bleibt beim Host-nginx (Cloudflare-Zertifikat). In der Server-Konfiguration für `triage.plhuber.de`
entfallen die alten `/api/`- und `/admin`-Blöcke; es bleibt ein einziger Block:

```nginx
location / {
    proxy_pass http://127.0.0.1:3010;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Dann prüfen und neu laden:

```sh
sudo nginx -t && sudo systemctl reload nginx
```

## Alte Container stoppen

Erst wenn die neue Seite über `https://triage.plhuber.de` funktioniert:

```sh
cd /opt/manv-triage
docker compose stop frontend api
```

**Nicht** stoppen: Postgres, Redis und Authentik in diesem Projekt. Authentik nutzt den alten Postgres-Container.

## Updates

Jeder Push auf `main` startet den Workflow `Deploy to Server`: Tests, Images bauen und nach GHCR pushen,
`docker-compose.yml` per SCP nach `/opt/manv-triage-app` (Repository-Variable `DEPLOY_PATH` überschreibt den Pfad)
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

```sh
cd /opt/manv-triage-app
docker compose stop api
docker compose exec backup ls /backups                       # Dateinamen ansehen
docker compose cp backup:/backups/manv-2026-01-31.sql.gz .   # optional: Kopie außerhalb des Volumes
gunzip -c manv-2026-01-31.sql.gz | docker compose exec -T db psql -U manv manv
docker compose start api
```

Die Sicherung ist ein normaler SQL-Dump. Für eine Wiederherstellung in eine frische Datenbank
`docker compose down -v` (löscht die Volumes!), `docker compose up -d db`, den Dump einspielen und danach alles starten.
Die Backups liegen auf demselben Server wie die Datenbank; für echten Schutz die Dateien regelmäßig extern kopieren.

## Lokal bauen und testen

```sh
cp deploy/.env.example deploy/.env   # Testwerte eintragen
docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.build.yml --env-file deploy/.env up -d --build
curl -s localhost:3010/api/health
docker compose -f deploy/docker-compose.yml -f deploy/docker-compose.build.yml --env-file deploy/.env down -v
```
