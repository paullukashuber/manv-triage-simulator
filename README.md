# ManV Triage Simulator

![Version](https://img.shields.io/badge/version-0.2-blue)
![Status](https://img.shields.io/badge/status-prototype-orange)
![License](https://img.shields.io/badge/license-MIT-green)
![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen?logo=github)

> ⚠️ **Prototyp (v0.2)** – Dieses Projekt befindet sich in einer frühen Entwicklungsphase. Inhalte, Algorithmus-Logik und Darstellung können Fehler enthalten. Feedback und Fehlermeldungen sind willkommen – bitte als [Issue](../../issues) melden.

Ein interaktiver, web-basierter Trainingssimulator für die **Patientensichtung beim Massenanfall von Verletzten (ManV)** nach dem **mSTaRT-Algorithmus**.


**[→ Live-Demo](https://paullukashuber.github.io/manv-triage-simulator/)**

---

## Was ist das?

Der Simulator ermöglicht es Helferinnen und Helfern im Rettungsdienst und Sanitätsdienst, den Sichtungsablauf bei einem Massenanfall von Verletzten interaktiv zu trainieren – ohne reale Patienten, ohne Aufbau einer ManV-Übung.

## Status

🟡 **Prototyp v0.2** – Grundfunktionalität vorhanden, aber:
- Fachliche Inhalte sind noch nicht abschließend geprüft
- Es können Fehler in der Algorithmus-Logik auftreten
- Szenarien werden noch erweitert

## Features

- ✅ Schritt-für-Schritt VOR-Sichtungsalgorithmus (Region Hannover)
- ✅ 8 realistische Patientenszenarien in zufälliger Reihenfolge
- ✅ Feedback nach abgeschlossener Sichtung mit Begründung
- ✅ Fehleranalyse und Gesamtauswertung
- ✅ Patientendaten durchgehend sichtbar während der Sichtung
- ✅ Mobile-First Design mit Triage-Farbsystem
- ✅ i18n-Vorbereitung (aktuell Deutsch, Englisch geplant)

## Schnellstart

**Option 1 – Live-Demo:**
Einfach die [GitHub Pages Demo](https://paullukashuber.github.io/manv-triage-simulator/) öffnen.

**Option 2 – Lokal entwickeln:**
```bash
git clone https://github.com/PaulLukasHuber/manv-triage-simulator.git
cd manv-triage-simulator
npm install
npm run dev
```

## Tech Stack

| Schicht | Technologie |
|---|---|
| Framework | React 19 |
| Build | Vite |
| Styling | Tailwind CSS 4 |
| State | useReducer (Custom Hook) |
| Sprache | i18n-ready (src/i18n/) |
| Deploy | GitHub Pages via GitHub Actions |

## Projektstruktur

```
src/
├── data/            Szenarien + Algorithmus-Schritte
├── hooks/           useSimulator (zentrale State-Logik)
├── screens/         5 Screen-Komponenten
├── components/      9 wiederverwendbare UI-Komponenten
├── i18n/            Sprachdateien (aktuell: Deutsch)
└── utils/           Konstanten + Hilfsfunktionen
```

## Roadmap

- [ ] Mehr Szenarien (Ziel: 15–20)
- [ ] Qualifikationswahl (SanH / RS / RA / NotSan)
- [ ] Modus „Vollständige Sichtung" (ABCDE mit LSM-Entscheidungen)
- [ ] Übungsmodus ManV-Lage (mehrere Patienten mit Zeitdruck)
- [ ] Lernkarten / Algorithmus-Referenz
- [ ] PWA / Offline-Fähigkeit
- [ ] Szenario-Editor für Ausbilder
- [ ] Englische Übersetzung

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