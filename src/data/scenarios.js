/**
 * Patient scenarios for VOR-Sichtung (pre-triage) training.
 */

export const scenarios = [
  {
    id: 1,
    description:
      "34-jähriger Mann, steht aufrecht am Straßenrand und hält sich den linken Arm. Er ist ansprechbar und orientiert.",
    correctAnswers: {
      tourniquet: false,
      ambulatory: true,
      deathSigns: false,
      stridor: false,
      airwayBlocked: false,
      abnormalBreathingRate: false,
      majorBleeding: false,
      noRadialPulse: false,
      unresponsive: false,
    },
    correctCategory: "white",
    reasoning:
      "Patient ist gehfähig → PAK weiß, Weiterleitung zur Sammelstelle. Die VOR-Sichtung endet beim ersten zutreffenden Punkt.",
  },
  {
    id: 2,
    description:
      "45-jährige Frau, liegt bewusstlos am Boden. Atmet regelmäßig. Kein Radialispuls tastbar (10 Sek. geprüft).",
    correctAnswers: {
      tourniquet: false,
      ambulatory: false,
      deathSigns: false,
      stridor: false,
      airwayBlocked: false,
      abnormalBreathingRate: false,
      majorBleeding: false,
      noRadialPulse: true,
      unresponsive: true,
    },
    correctCategory: "red",
    reasoning:
      "Kein Radialispuls tastbar → SK 1. Beim ersten zutreffenden SK-1-Kriterium wird gestoppt (C-Problem: fehlender Radialispuls).",
  },
  {
    id: 3,
    description:
      "52-jähriger Mann, nicht gehfähig, schreit vor Schmerzen. Massive arterielle Blutung am rechten Oberschenkel.",
    correctAnswers: {
      tourniquet: true,
      ambulatory: false,
      deathSigns: false,
      stridor: false,
      airwayBlocked: false,
      abnormalBreathingRate: false,
      majorBleeding: true,
      noRadialPulse: false,
      unresponsive: false,
    },
    correctCategory: "red",
    reasoning:
      "Lebensbedrohliche Blutung → SK 1. Zusätzlich: Tourniquet als Sofortmaßnahme bei lebensbedrohlicher Extremitätenblutung.",
  },
  {
    id: 4,
    description:
      "Ältere Frau, liegt regungslos. Totenstarre erkennbar, livide Totenflecken am Rücken sichtbar.",
    correctAnswers: {
      tourniquet: false,
      ambulatory: false,
      deathSigns: true,
      stridor: false,
      airwayBlocked: false,
      abnormalBreathingRate: false,
      majorBleeding: false,
      noRadialPulse: false,
      unresponsive: false,
    },
    correctCategory: "dead",
    reasoning:
      "Sichere Todeszeichen (Totenstarre + Totenflecken) → Kategorie ‚tot'. Counterzählung, zeitnah abdecken, PAK auf tot stellen. Ärztliche Leichenschau erforderlich.",
  },
  {
    id: 5,
    description:
      "8-jähriges Kind, wach und ansprechbar, Schürfwunden. Atemfrequenz gezählt: 48/min.",
    correctAnswers: {
      tourniquet: false,
      ambulatory: false,
      deathSigns: false,
      stridor: false,
      airwayBlocked: false,
      abnormalBreathingRate: true,
      majorBleeding: false,
      noRadialPulse: false,
      unresponsive: false,
    },
    correctCategory: "red",
    reasoning:
      "Pathologische Atemfrequenz bei Kindern: AF > 40/min → SK 1. Grenzwerte: Kinder (< 15 oder > 40), Erwachsene (< 10 oder > 30)!",
  },
  {
    id: 6,
    description:
      "38-jähriger Mann, liegt am Boden, ansprechbar und orientiert. Offene Unterschenkelfraktur rechts, keine Blutungsproblematik. AF 16/min, Radialispuls tastbar.",
    correctAnswers: {
      tourniquet: false,
      ambulatory: false,
      deathSigns: false,
      stridor: false,
      airwayBlocked: false,
      abnormalBreathingRate: false,
      majorBleeding: false,
      noRadialPulse: false,
      unresponsive: false,
    },
    correctCategory: "yellow",
    reasoning:
      "Keiner der SK-1-Punkte zutreffend (kein A/B/C/D-Problem) → SK 2 (aufgeschobene Behandlung). Patient verletzt, aber nicht unmittelbar vital gefährdet.",
  },
  {
    id: 7,
    description:
      "30-jährige Frau, aus Brandraum gerettet. Rußspuren im Gesicht, pfeifendes/stridoröses Atemgeräusch hörbar.",
    correctAnswers: {
      tourniquet: false,
      ambulatory: false,
      deathSigns: false,
      stridor: true,
      airwayBlocked: false,
      abnormalBreathingRate: false,
      majorBleeding: false,
      noRadialPulse: false,
      unresponsive: false,
    },
    correctCategory: "red",
    reasoning:
      "Inhalationstrauma mit Stridor → SK 1 (A-Problem). Stridor weist auf Schwellung der oberen Atemwege hin – akute Erstickungsgefahr!",
  },
  {
    id: 8,
    description:
      "60-jähriger Mann, liegt unterkühlt in einer Pfütze. Reagiert kaum. Atemfrequenz sehr langsam: 7/min.",
    correctAnswers: {
      tourniquet: false,
      ambulatory: false,
      deathSigns: false,
      stridor: false,
      airwayBlocked: false,
      abnormalBreathingRate: true,
      majorBleeding: false,
      noRadialPulse: false,
      unresponsive: true,
    },
    correctCategory: "red",
    reasoning:
      "Pathologische Atemfrequenz: AF 7/min (< 10 bei Erwachsenen) → SK 1 (B-Problem). Patient ist vital gefährdet.",
  },
];
