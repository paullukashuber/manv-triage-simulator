import { useSimulator } from "./hooks/useSimulator";
import { SCREENS } from "./utils/constants";
import StartScreen from "./screens/StartScreen";
import ScenarioIntro from "./screens/ScenarioIntro";
import TriageStep from "./screens/TriageStep";
import ScenarioResult from "./screens/ScenarioResult";
import Summary from "./screens/Summary";

export default function App() {
  const simulator = useSimulator();
  const { screen } = simulator.state;

  const screens = {
    [SCREENS.START]: StartScreen,
    [SCREENS.SCENARIO_INTRO]: ScenarioIntro,
    [SCREENS.TRIAGE_STEP]: TriageStep,
    [SCREENS.SCENARIO_RESULT]: ScenarioResult,
    [SCREENS.SUMMARY]: Summary,
  };

  const ScreenComponent = screens[screen] || StartScreen;

  return (
    <div className="min-h-dvh flex flex-col items-center">
      <div className="w-full max-w-[480px] min-h-dvh flex flex-col p-4 gap-4">
        <ScreenComponent simulator={simulator} />
      </div>
    </div>
  );
}
