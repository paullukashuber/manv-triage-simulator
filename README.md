# ManV Triage Simulator

> ⚠️ **Prototyp (v0.1)** – Dieses Projekt befindet sich in einer frühen Entwicklungsphase. Inhalte, Algorithmus-Logik und Darstellung können Fehler enthalten. Feedback und Fehlermeldungen sind willkommen – bitte als [Issue](../../issues) melden.

Ein interaktiver, web-basierter Trainingssimulator für die **Patientensichtung beim Massenanfall von Verletzten (ManV)** nach dem **mSTaRT-Algorithmus**.

## Was ist das?

Der Simulator ermöglicht es Helferinnen und Helfern im Rettungsdienst und Sanitätsdienst, den Sichtungsablauf bei einem Massenanfall von Verletzten interaktiv zu trainieren – ohne reale Patienten, ohne Aufbau einer ManV-Übung.

**Aktuell implementiert:** VOR-Sichtung nach dem Algorithmus der Region Hannover.

## Status

🟡 **Prototyp v0.1** – Grundfunktionalität vorhanden, aber:
- Fachliche Inhalte sind noch nicht abschließend geprüft
- Es können Fehler in der Algorithmus-Logik auftreten
- UI/UX wird noch überarbeitet
- Szenarien werden noch erweitert

## Features

- Schritt-für-Schritt VOR-Sichtungsalgorithmus
- 8 realistische Patientenszenarien (zufällige Reihenfolge)
- Sofortfeedback nach abgeschlossener Sichtung mit Begründung
- Fehleranalyse und Gesamtauswertung
- Mobile-First Design (optimiert für Tablets und Smartphones)
- Keine Installation nötig – läuft direkt im Browser

## Schnellstart

1. `index.html` herunterladen
2. Im Browser öffnen – fertig.

Alternativ mit VS Code Live Server:
```
code index.html
# Rechtsklick → "Open with Live Server"
```

## Technik

- Einzelne HTML-Datei, kein Build-Schritt
- Vanilla HTML + CSS + JavaScript
- Keine externen Abhängigkeiten
- Kein Backend, keine Datenbank

## Roadmap

- [ ] Qualifikationswahl (SanH / RS / RA / NotSan)
- [ ] Modus „Vollständige Sichtung" (ABCDE mit LSM-Entscheidungen)
- [ ] Mehr Szenarien (Ziel: 15–20)
- [ ] Übungsmodus ManV-Lage (mehrere Patienten mit Zeitdruck)
- [ ] Lernkarten / Algorithmus-Referenz
- [ ] PWA / Offline-Fähigkeit
- [ ] Vieles mehr...

## Fachlicher Hintergrund

Der Simulator basiert auf:
- **mSTaRT** (modified Simple Triage and Rapid Treatment)
- Checkliste VOR-Sichtung, Algorithmus Region Hannover
- Lebensrettende Sofortmaßnahmen (LSM-Karte)

## Lizenz

MIT – siehe [LICENSE](LICENSE).

---

> **Hinweis:** Dieses Tool dient ausschließlich zu Trainingszwecken und ersetzt keine zertifizierte Ausbildung. Bei Widersprüchen gilt immer das aktuellste offizielle Schulungsmaterial.
