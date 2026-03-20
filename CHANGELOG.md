# Changelog

Alle relevanten Änderungen am Projekt werden hier dokumentiert.

## [0.2] – 2026-03-20

### Migration auf React + Vite + Tailwind

- Komplette Neuentwicklung auf React 19 + Vite + Tailwind CSS 4
- Modulare Komponentenstruktur (9 Components, 5 Screens)
- Zentrale State-Logik via useSimulator Hook (useReducer)
- i18n-Vorbereitung: alle UI-Texte in src/i18n/de.js
- Englische Code-Keys, deutsche UI-Ausgabe
- Design: Slate Teal Akzentfarbe, kompaktes Layout, Sticky Buttons
- DM Sans als Schrift
- Triage-Farbsystem: Farbe nur wo sie Bedeutung hat
- Patientendaten bleiben während gesamter Sichtung sichtbar
- Flatterband-Hinweis nach Sichtungsabschluss
- Prototyp-Warnung als Modal beim Start
- GitHub Actions Workflow für automatisches Deploy

## [0.1] – 2026-03-19

### Erster Prototyp (Vanilla HTML)

- VOR-Sichtungsalgorithmus nach Region Hannover
- 8 Patientenszenarien mit korrekten SK-Zuordnungen
- Schritt-für-Schritt Sichtung mit Ja/Nein-Entscheidungen
- Feedback nach abgeschlossener Sichtung (nicht pro Einzelschritt)
- Patientendaten während gesamter Sichtung sichtbar
- Flatterband-Hinweis nach Sichtungsabschluss
- Gesamtauswertung mit Fehleranalyse
- Prototyp-Warnung als Popup
- Mobile-First Design, Triage-Farbsystem
- Veröffentlichung auf GitHub Pages