/**
 * VOR-Sichtung (pre-triage) algorithm steps.
 *
 * Each step's `key` maps to:
 *   - a field in scenario.correctAnswers
 *   - a translation key in i18n (steps.<key>.question / steps.<key>.hint)
 *
 * The algorithm stops at the FIRST positive finding (endsAssessment + endsOnYes).
 * Exception: tourniquet is an immediate measure that does NOT end the assessment.
 */

export const triageSteps = [
  {
    key: "tourniquet",
    type: "yesno",
    badgeType: "c",
    badgeLabel: "C",
    endsAssessment: false,
  },
  {
    key: "ambulatory",
    type: "yesno",
    badgeType: "info",
    badgeLabel: "?",
    endsAssessment: true,
    endsOnYes: true,
    result: "white",
  },
  {
    key: "deathSigns",
    type: "yesno",
    badgeType: "info",
    badgeLabel: "†",
    endsAssessment: true,
    endsOnYes: true,
    result: "dead",
  },
  {
    key: "stridor",
    type: "yesno",
    badgeType: "a",
    badgeLabel: "A",
    endsAssessment: true,
    endsOnYes: true,
    result: "red",
  },
  {
    key: "airwayBlocked",
    type: "yesno",
    badgeType: "a",
    badgeLabel: "A",
    endsAssessment: true,
    endsOnYes: true,
    result: "red",
  },
  {
    key: "abnormalBreathingRate",
    type: "yesno",
    badgeType: "b",
    badgeLabel: "B",
    endsAssessment: true,
    endsOnYes: true,
    result: "red",
  },
  {
    key: "majorBleeding",
    type: "yesno",
    badgeType: "c",
    badgeLabel: "C",
    endsAssessment: true,
    endsOnYes: true,
    result: "red",
  },
  {
    key: "noRadialPulse",
    type: "yesno",
    badgeType: "c",
    badgeLabel: "C",
    endsAssessment: true,
    endsOnYes: true,
    result: "red",
  },
  {
    key: "unresponsive",
    type: "yesno",
    badgeType: "d",
    badgeLabel: "D",
    endsAssessment: true,
    endsOnYes: true,
    result: "red",
  },
];

/** Fallback category when no positive finding is identified */
export const FALLBACK_CATEGORY = "yellow";
