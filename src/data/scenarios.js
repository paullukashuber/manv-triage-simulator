/**
 * Patient scenarios for VOR-Sichtung (pre-triage) training.
 *
 * Keys are English for code consistency.
 * Display texts (description, reasoning) are German – sourced from i18n later
 * if full i18n is needed, but kept inline here for scenario-specific content.
 *
 * Category distribution (18 scenarios):
 *   red (SK1):    9  – covers all ABCD triggers
 *   yellow (SK2): 4  – important: no overtriage
 *   white:        3  – ambulatory patients
 *   dead:         2  – definitive death signs
 */

export const scenarios = [
  // ═══════════════════════════════════════════════
  // WHITE – ambulatory patients
  // ═══════════════════════════════════════════════
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
    id: 9,
    description:
      "22-jährige Frau, geht selbstständig umher, weint, hat eine blutende Schnittwunde an der Stirn. Ansprechbar und orientiert.",
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
      "Patientin ist gehfähig → PAK weiß. Die Stirnwunde blutet zwar, ist aber nicht lebensbedrohlich. Gehfähige Patienten gehen immer zur Sammelstelle – auch wenn sie verletzt sind.",
  },
  {
    id: 10,
    description:
      "50-jähriger Mann, steht leicht schwankend, klagt über Schwindel und Übelkeit. Kann selbstständig gehen. Keine sichtbaren Verletzungen.",
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
      "Patient ist gehfähig → PAK weiß. Trotz Schwindel und Übelkeit: Wer selbstständig gehen kann, wird zur Sammelstelle weitergeleitet. Dort erfolgt ggf. weitere Betreuung.",
  },

  // ═══════════════════════════════════════════════
  // DEAD – definitive death signs
  // ═══════════════════════════════════════════════
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
    id: 11,
    description:
      "Mann, eingeklemmt unter Betonplatte. Kopf massiv deformiert, mit dem Leben nicht vereinbare Verletzungen erkennbar.",
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
      "Mit dem Leben nicht vereinbare Verletzungen = sichere Todeszeichen → Kategorie ‚tot'. Keine Reanimation im ManV-Kontext. Counterzählung, abdecken, Leichenschau erforderlich.",
  },

  // ═══════════════════════════════════════════════
  // RED (SK1) – A-Problems
  // ═══════════════════════════════════════════════
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
    id: 12,
    description:
      "40-jähriger Mann, bewusstlos nach Sturz. Schnarcht laut, Unterkiefer fällt zurück. Ohne Maßnahmen droht Atemwegsverlegung.",
    correctAnswers: {
      tourniquet: false,
      ambulatory: false,
      deathSigns: false,
      stridor: false,
      airwayBlocked: true,
      abnormalBreathingRate: false,
      majorBleeding: false,
      noRadialPulse: false,
      unresponsive: true,
    },
    correctCategory: "red",
    reasoning:
      "Offenhalten des Atemwegs erforderlich → SK 1 (A-Problem). Das Schnarchen zeigt eine Verlegung der oberen Atemwege an. Esmarch-Handgriff oder Seitenlage nötig.",
  },

  // ═══════════════════════════════════════════════
  // RED (SK1) – B-Problems
  // ═══════════════════════════════════════════════
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
  {
    id: 13,
    description:
      "28-jährige Frau, Motorradunfall, liegt auf dem Rücken. Wach, klagt über Atemnot. AF gezählt: 34/min.",
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
      "Pathologische Atemfrequenz: AF 34/min (> 30 bei Erwachsenen) → SK 1 (B-Problem). Auch knapp über dem Grenzwert ist pathologisch!",
  },

  // ═══════════════════════════════════════════════
  // RED (SK1) – C-Problems
  // ═══════════════════════════════════════════════
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
    id: 14,
    description:
      "36-jähriger Mann, Stichverletzung am Bauch. Ansprechbar, aber blass. Pulsierendes Blut tritt aus der Wunde aus.",
    correctAnswers: {
      tourniquet: false,
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
      "Lebensbedrohliche Blutung (pulsierend = arteriell) → SK 1 (C-Problem). Achtung: Kein Tourniquet möglich bei Rumpfverletzung – Packing/Kompression nötig.",
  },

  // ═══════════════════════════════════════════════
  // RED (SK1) – D-Problem
  // ═══════════════════════════════════════════════
  {
    id: 15,
    description:
      "70-jährige Frau, liegt auf der Seite. Augen geschlossen, reagiert nicht auf Ansprache, reagiert nur auf Schmerzreiz mit ungezielter Abwehr. AF 18/min, Radialispuls tastbar.",
    correctAnswers: {
      tourniquet: false,
      ambulatory: false,
      deathSigns: false,
      stridor: false,
      airwayBlocked: false,
      abnormalBreathingRate: false,
      majorBleeding: false,
      noRadialPulse: false,
      unresponsive: true,
    },
    correctCategory: "red",
    reasoning:
      "Keine gezielte Reaktion auf Ansprache (WASB < W) → SK 1 (D-Problem). Obwohl Atmung und Kreislauf unauffällig sind, reicht das Bewusstseinskriterium allein für SK 1.",
  },

  // ═══════════════════════════════════════════════
  // YELLOW (SK2) – no ABCD problems
  // ═══════════════════════════════════════════════
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
    id: 16,
    description:
      "45-jähriger Mann, sitzt am Boden, kann nicht aufstehen. Geschlossene Oberschenkelfraktur links, starke Schmerzen. Ansprechbar, AF 20/min, Radialispuls kräftig tastbar.",
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
      "Trotz starker Schmerzen und Fraktur: Kein A/B/C/D-Problem → SK 2. Nicht gehfähig, aber nicht vital gefährdet. Häufiger Fehler: Schmerzpatienten werden zu hoch triagiert.",
  },
  {
    id: 17,
    description:
      "55-jährige Frau, nicht gehfähig, Beckenschmerzen nach Sturz. Wach, orientiert, AF 14/min, Radialispuls tastbar. Keine äußere Blutung sichtbar.",
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
      "Kein A/B/C/D-Problem → SK 2. Achtung: Beckenfrakturen können innere Blutungen verursachen – in der VOR-Sichtung wird aber nur nach sichtbaren Befunden entschieden.",
  },
  {
    id: 18,
    description:
      "19-jähriger Mann, kann nicht aufstehen, Schmerzen im Rücken nach Sprung aus dem Fenster. Wach und voll orientiert. AF 16/min, Radialispuls tastbar, bewegt alle Extremitäten.",
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
      "Kein A/B/C/D-Problem → SK 2. Obwohl der Unfallmechanismus (Sturz aus Höhe) gefährlich klingt, zeigt die VOR-Sichtung keine akute vitale Bedrohung. Die vollständige Sichtung könnte anders bewerten.",
  },
];