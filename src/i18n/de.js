/**
 * German language file.
 * All user-facing strings live here – nothing hardcoded in components.
 */

export const de = {
  app: {
    title: "ManV Triage Simulator",
    subtitle: "VOR-Sichtung",
    version: "Prototyp v0.2",
    badge: "Trainingsmodus",
  },

  prototypeModal: {
    title: "Prototyp – v0.2",
    text: "Dieses Tool befindet sich in einer frühen Entwicklungsphase. Inhalte, Algorithmus-Logik und Darstellung können Fehler enthalten und sind noch nicht abschließend geprüft.",
    cta: "Fehler gerne als Issue auf GitHub melden.",
    button: "Verstanden",
  },

  start: {
    heading: "VOR-Sichtung üben",
    description:
      "Durchlaufe den Vorsichtungsalgorithmus Schritt für Schritt. Die Sichtung endet beim ersten zutreffenden Punkt – pro Patient nur 1 Entscheidung.",
    button: "Training starten",
    features: [
      "18 realistische Patientenszenarien",
      "Auswertung nach abgeschlossener Sichtung",
      "Detaillierte Fehleranalyse am Ende",
    ],
  },

  scenarioIntro: {
    patientCounter: "Patient {current} von {total}",
    missionLabel: "Einsatzmeldung",
    info: "Gehe den VOR-Sichtungsalgorithmus Schritt für Schritt durch. Dein Feedback erhältst du am Ende der Sichtung.",
    button: "VOR-Sichtung beginnen",
  },

  triage: {
    headerTitle: "VOR-Sichtung",
    patientLabel: "Patient",
    stepProgress: "Schritt {current}/{total}",
    yes: "Ja",
    no: "Nein",
  },

  result: {
    headerTitle: "Ergebnis VOR-Sichtung",
    correct: "✓ Korrekt eingestuft",
    wrong: "✗ Falsch eingestuft",
    yourCategory: "Deine Einstufung",
    correctCategory: "Korrekte Einstufung",
    reasoning: "Begründung",
    errorsHeading: "Fehler bei der Sichtung",
    errorYourAnswer: "Deine Antwort",
    errorCorrectAnswer: "Richtig",
    nextPatient: "Nächster Patient →",
    toSummary: "Zur Auswertung →",
  },

  barrierTape: {
    title: "Flatterband anbringen",
    hint: "Ort: 1. Oberarm rechts, sonst Oberarm links. Dokumentation VOR-Sichtung abschließen.",
  },

  summary: {
    badge: "Auswertung",
    heading: "VOR-Sichtung abgeschlossen",
    patientsCorrect: "Patienten korrekt eingestuft",
    distributionLabel: "SK-Verteilung (korrekt)",
    detailHeading: "Ergebnisse im Detail",
    patientPrefix: "Patient",
    correctLabel: "Korrekt",
    yourAnswerLabel: "Deine Antwort",
    retryButton: "Nochmal üben",
    homeButton: "Startseite",
    ratings: {
      perfect: "Hervorragend! Alle Patienten korrekt eingestuft.",
      good: "Gutes Ergebnis! Einzelne Punkte solltest du noch vertiefen.",
      okay: "Solide Basis, aber es gibt noch Verbesserungspotenzial.",
      needsPractice:
        "Den Algorithmus solltest du noch intensiv üben. Wiederholung hilft!",
    },
  },

  /**
   * Category display labels.
   * Keys match CATEGORIES ids from constants.js.
   */
  categories: {
    red: { short: "SK 1", full: "SK 1 – Sofortbehandlung" },
    yellow: { short: "SK 2", full: "SK 2 – Aufgeschobene Behandlung" },
    white: { short: "PAK weiß", full: "PAK weiß – Sammelstelle" },
    dead: { short: "Tot", full: "Tot – Leichenschau erforderlich" },
  },

  /**
   * Triage step questions and hints.
   * Keys match triageSteps[].key from triageSteps.js.
   */
  steps: {
    tourniquet: {
      question: "Lebensbedrohliche Extremitätenblutung erkennbar?",
      hint: "Falls ja → sofort Tourniquet anlegen! Zeit notieren.\nSofortmaßnahme VOR der eigentlichen Sichtung.",
    },
    ambulatory: {
      question: "Ist der Patient gehfähig?",
      hint: "Kann der Patient selbstständig gehen?\n→ Wenn ja: PAK weiß, Sammelstelle.",
    },
    deathSigns: {
      question: "Sind sichere Todeszeichen vorhanden?",
      hint: "Totenstarre, Totenflecken, mit dem Leben nicht vereinbare Verletzungen.\n→ Counterzählung, abdecken, Leichenschau erforderlich.",
    },
    stridor: {
      question: "Inhalationstrauma mit Stridor?",
      hint: "Pfeifendes Atemgeräusch nach Rauchgas-/Hitzeexposition?\n→ Schwellung der oberen Atemwege = akute Gefahr.",
    },
    airwayBlocked: {
      question: "Offenhalten des Atemwegs erforderlich?",
      hint: "Verlegter Atemweg, Gurgelgeräusche, Schnarchen bei Bewusstlosigkeit?",
    },
    abnormalBreathingRate: {
      question: "Pathologische Atemfrequenz?",
      hint: "Erwachsene: AF < 10 oder > 30/min\nKleinkinder: AF < 15 oder > 40/min",
    },
    majorBleeding: {
      question: "Lebensbedrohliche Blutung?",
      hint: "Massive Blutung, die nicht durch einfachen Druckverband kontrollierbar ist?",
    },
    noRadialPulse: {
      question: "Kein Radialispuls tastbar?",
      hint: "Untersuchungsdauer: 10 Sekunden.\nKein tastbarer Radialispuls ≙ RR < 80 mmHg → Schockzeichen.",
    },
    unresponsive: {
      question: "Keine gezielte Reaktion auf Ansprache?",
      hint: "Patient reagiert nicht gezielt auf direkte Ansprache (WASB < W).",
    },
  },
};
