# Changelog

All notable changes to this project will be documented in this file.

## [0.2] – 2026-03-20

### Migration to React + Vite + Tailwind

- Complete rebuild on React 19 + Vite + Tailwind CSS 4
- Modular component architecture (9 components, 5 screens)
- Central state logic via useSimulator hook (useReducer)
- i18n preparation: all UI strings in src/i18n/de.js
- English code keys, German UI output
- Design: Slate Teal accent color, compact layout, sticky action buttons
- DM Sans font via Google Fonts
- Triage color system: color only where it carries meaning
- Patient data stays visible throughout entire triage process
- Barrier tape reminder after triage completion
- Prototype warning modal on first load
- GitHub Actions workflow for automated deployment

## [0.1] – 2026-03-19

### Initial prototype (Vanilla HTML)

- Pre-triage (VOR-Sichtung) algorithm
- 8 patient scenarios with correct triage category assignments
- Step-by-step triage with yes/no decisions
- Feedback after completed triage (not per individual step)
- Patient data visible during entire triage process
- Barrier tape reminder after triage completion
- Summary with error analysis
- Prototype warning popup
- Mobile-first design with triage color system
- Published on GitHub Pages