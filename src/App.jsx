import { useSimulator } from "./hooks/useSimulator";
import { SCREENS } from "./utils/constants";
import PrototypeModal from "./components/PrototypeModal";
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
    <>
      <PrototypeModal />
      <div className="min-h-dvh flex flex-col items-center">
        <div className="w-full max-w-[480px] flex flex-col p-4 pb-0 gap-3">
          <ScreenComponent simulator={simulator} />
        </div>
      </div>
    </>
  );
}
