export const VERSION = "0.1";

export const CATEGORIES = {
  red: {
    id: "red",
    color: "var(--color-sk1)",
    textColor: "#ffffff",
    cssClass: "category-red",
  },
  yellow: {
    id: "yellow",
    color: "var(--color-sk2)",
    textColor: "#000000",
    cssClass: "category-yellow",
  },
  white: {
    id: "white",
    color: "var(--color-white)",
    textColor: "#333333",
    border: "#aaaaaa",
    cssClass: "category-white",
  },
  dead: {
    id: "dead",
    color: "var(--color-dead)",
    textColor: "#ffffff",
    cssClass: "category-dead",
  },
};

export const BADGE_STYLES = {
  a: { bg: "bg-[#CC0000]", text: "text-white" },
  b: { bg: "bg-[#d97706]", text: "text-white" },
  c: { bg: "bg-[#9333ea]", text: "text-white" },
  d: { bg: "bg-[#6d28d9]", text: "text-white" },
  info: {
    bg: "bg-[var(--color-bg-elevated)]",
    text: "text-[var(--color-accent)]",
  },
};

export const SCREENS = {
  START: "start",
  SCENARIO_INTRO: "scenarioIntro",
  TRIAGE_STEP: "triageStep",
  SCENARIO_RESULT: "scenarioResult",
  SUMMARY: "summary",
};
