import { useReducer, useCallback } from "react";
import { scenarios } from "../data/scenarios";
import { triageSteps, FALLBACK_CATEGORY } from "../data/triageSteps";
import { SCREENS } from "../utils/constants";
import { shuffle } from "../utils/helpers";

// ── Initial State ──

const initialState = {
  screen: SCREENS.START,

  // Scenario pool (shuffled queue)
  pool: [],
  totalScenarios: scenarios.length,

  // Current scenario
  scenario: null,
  scenarioIndex: 0, // 1-based counter for display

  // Triage step tracking
  stepIndex: 0,
  answers: [], // { key, userAnswer, correctAnswer }

  // Result for current scenario
  userCategory: null,

  // Accumulated results across all scenarios
  results: [], // { scenario, userCategory, correctCategory, isCorrect, errors[] }
};

// ── Action Types ──

const ACTIONS = {
  START_TRAINING: "START_TRAINING",
  BEGIN_SCENARIO: "BEGIN_SCENARIO",
  ANSWER: "ANSWER",
  NEXT_SCENARIO: "NEXT_SCENARIO",
  RESET: "RESET",
};

// ── Reducer ──

function simulatorReducer(state, action) {
  switch (action.type) {
    case ACTIONS.START_TRAINING: {
      const pool = shuffle(scenarios);
      const first = pool[0];
      const remaining = pool.slice(1);

      return {
        ...initialState,
        screen: SCREENS.SCENARIO_INTRO,
        pool: remaining,
        scenario: first,
        scenarioIndex: 1,
        results: [],
      };
    }

    case ACTIONS.BEGIN_SCENARIO: {
      return {
        ...state,
        screen: SCREENS.TRIAGE_STEP,
        stepIndex: 0,
        answers: [],
        userCategory: null,
      };
    }

    case ACTIONS.ANSWER: {
      const { userAnswer } = action.payload;
      const step = triageSteps[state.stepIndex];
      const correctAnswer = state.scenario.correctAnswers[step.key];

      const newAnswer = {
        key: step.key,
        userAnswer,
        correctAnswer,
      };
      const updatedAnswers = [...state.answers, newAnswer];

      // Tourniquet (or any non-ending step): record and advance
      if (!step.endsAssessment) {
        const nextIndex = state.stepIndex + 1;

        // Safety: if somehow past last step
        if (nextIndex >= triageSteps.length) {
          return finishScenario(state, updatedAnswers, FALLBACK_CATEGORY);
        }

        return {
          ...state,
          stepIndex: nextIndex,
          answers: updatedAnswers,
        };
      }

      // User said Yes on an ending step → assign this category, finish
      if (userAnswer) {
        return finishScenario(state, updatedAnswers, step.result);
      }

      // User said No → advance to next step
      const nextIndex = state.stepIndex + 1;

      // All steps exhausted → fallback category (yellow / SK 2)
      if (nextIndex >= triageSteps.length) {
        return finishScenario(state, updatedAnswers, FALLBACK_CATEGORY);
      }

      return {
        ...state,
        stepIndex: nextIndex,
        answers: updatedAnswers,
      };
    }

    case ACTIONS.NEXT_SCENARIO: {
      // No more scenarios → summary
      if (state.pool.length === 0) {
        return {
          ...state,
          screen: SCREENS.SUMMARY,
        };
      }

      // Pull next scenario from pool
      const next = state.pool[0];
      const remaining = state.pool.slice(1);

      return {
        ...state,
        screen: SCREENS.SCENARIO_INTRO,
        pool: remaining,
        scenario: next,
        scenarioIndex: state.scenarioIndex + 1,
        stepIndex: 0,
        answers: [],
        userCategory: null,
      };
    }

    case ACTIONS.RESET: {
      return { ...initialState };
    }

    default:
      return state;
  }
}

// ── Helper: Finish a scenario and build result ──

function finishScenario(state, answers, userCategory) {
  const scenario = state.scenario;
  const isCorrect = userCategory === scenario.correctCategory;

  const errors = answers
    .filter((a) => a.userAnswer !== a.correctAnswer)
    .map((a) => ({
      key: a.key,
      userAnswer: a.userAnswer,
      correctAnswer: a.correctAnswer,
    }));

  const result = {
    scenario,
    userCategory,
    correctCategory: scenario.correctCategory,
    isCorrect,
    errors,
  };

  return {
    ...state,
    screen: SCREENS.SCENARIO_RESULT,
    answers,
    userCategory,
    results: [...state.results, result],
  };
}

// ── Hook ──

export function useSimulator() {
  const [state, dispatch] = useReducer(simulatorReducer, initialState);

  const actions = {
    startTraining: useCallback(
      () => dispatch({ type: ACTIONS.START_TRAINING }),
      []
    ),
    beginScenario: useCallback(
      () => dispatch({ type: ACTIONS.BEGIN_SCENARIO }),
      []
    ),
    answer: useCallback(
      (userAnswer) => dispatch({ type: ACTIONS.ANSWER, payload: { userAnswer } }),
      []
    ),
    nextScenario: useCallback(
      () => dispatch({ type: ACTIONS.NEXT_SCENARIO }),
      []
    ),
    reset: useCallback(
      () => dispatch({ type: ACTIONS.RESET }),
      []
    ),
  };

  // Derived values
  const currentStep = triageSteps[state.stepIndex] ?? null;
  const totalSteps = triageSteps.length;
  const currentResult = state.results[state.results.length - 1] ?? null;
  const hasMoreScenarios = state.pool.length > 0;

  const correctCount = state.results.filter((r) => r.isCorrect).length;
  const totalCompleted = state.results.length;
  const scorePercent =
    totalCompleted > 0 ? Math.round((correctCount / totalCompleted) * 100) : 0;

  // Category distribution (based on correct categories)
  const categoryDistribution = state.results.reduce(
    (acc, r) => {
      if (acc[r.correctCategory] !== undefined) {
        acc[r.correctCategory]++;
      }
      return acc;
    },
    { red: 0, yellow: 0, white: 0, dead: 0 }
  );

  return {
    state,
    actions,

    // Convenience accessors
    currentStep,
    totalSteps,
    currentResult,
    hasMoreScenarios,
    correctCount,
    totalCompleted,
    scorePercent,
    categoryDistribution,
  };
}
