# ManV Triage Simulator

![Version](https://img.shields.io/badge/version-0.1-blue)
![Status](https://img.shields.io/badge/status-prototype-orange)
![License](https://img.shields.io/badge/license-MIT-green)
![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen?logo=github)

> ⚠️ **Prototyp (v0.1)** – Dieses Projekt befindet sich in einer frühen Entwicklungsphase. Inhalte, Algorithmus-Logik und Darstellung können Fehler enthalten. Feedback und Fehlermeldungen sind willkommen – bitte als [Issue](../../issues) melden.

Ein interaktiver, web-basierter Trainingssimulator für die **Patientensichtung beim Massenanfall von Verletzten (ManV)** nach dem **mSTaRT-Algorithmus**.

**[→ Live-Demo](https://paullukashuber.github.io/manv-triage-simulator/)**

---

## Was ist das?

Der Simulator ermöglicht es Helferinnen und Helfern im Rettungsdienst und Sanitätsdienst, den Sichtungsablauf bei einem Massenanfall von Verletzten interaktiv zu trainieren – ohne reale Patienten, ohne Aufbau einer ManV-Übung.

## Status

🟡 **Prototyp v0.1** – Grundfunktionalität vorhanden, aber:
- Fachliche Inhalte sind noch nicht abschließend geprüft
- Es können Fehler in der Algorithmus-Logik auftreten
- UI/UX wird noch überarbeitet
- Szenarien werden noch erweitert

## Features

- ✅ Schritt-für-Schritt VOR-Sichtungsalgorithmus (Region Hannover)
- ✅ 8 realistische Patientenszenarien in zufälliger Reihenfolge
- ✅ Feedback nach abgeschlossener Sichtung mit Begründung
- ✅ Fehleranalyse und Gesamtauswertung
- ✅ Mobile-First Design (optimiert für Tablets und Smartphones)
- ✅ Keine Installation nötig – läuft direkt im Browser

## Schnellstart

**Option 1 – Live-Demo:**
Einfach die [GitHub Pages Demo](https://paullukashuber.github.io/manv-triage-simulator/) öffnen.

**Option 2 – Lokal:**
```bash
git clone https://github.com/PaulLukasHuber/manv-triage-simulator.git
cd manv-triage-simulator
# index.html im Browser öffnen – fertig.
```

## Technik

| Aktuell (v0.1) | In Entwicklung (v0.2) |
|---|---|
| Vanilla HTML/CSS/JS | React + Vite + Tailwind CSS |
| Einzelne HTML-Datei | Modulare Komponentenstruktur |
| Keine Abhängigkeiten | i18n-Vorbereitung (DE/EN) |

## Roadmap

- [ ] Migration auf React + Vite + Tailwind CSS
- [ ] Qualifikationswahl (SanH / RS / RA / NotSan)
- [ ] Modus „Vollständige Sichtung" (ABCDE mit LSM-Entscheidungen)
- [ ] Mehr Szenarien (Ziel: 15–20)
- [ ] Übungsmodus ManV-Lage (mehrere Patienten mit Zeitdruck)
- [ ] Lernkarten / Algorithmus-Referenz
- [ ] PWA / Offline-Fähigkeit
- [ ] Szenario-Editor für Ausbilder

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
