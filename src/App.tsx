/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, css } from "@emotion/react/macro";
import { ReactNode } from "react";
import Configs from "./components/steps/Configs";
import Details from "./components/steps/Details";
import Landing from "./components/steps/Landing";
import Quantities from "./components/steps/Quantities";
import Results from "./components/steps/Results";
import Schedules from "./components/steps/Schedules";
import Systems from "./components/steps/Systems";
import { useStore } from "./store/store";
import { fonts } from "./styleHelpers";

const App = () => {
  const step = useStore((state) => state.currentStep);
  return (
    <div
      css={css`
        height: 100%;
        ${fonts}
      `}
    >
      {getStepComponent(step)}
    </div>
  );
};

const getStepComponent = (step: number) => {
  let component: ReactNode;

  switch (step) {
    case 1:
      component = <Details />;
      break;

    case 2:
      component = <Systems />;
      break;

    case 3:
      component = <Configs />;
      break;

    case 4:
      component = <Quantities />;
      break;

    case 5:
      component = <Schedules />;
      break;

    case 6:
      component = <Results />;
      break;

    case 0:
    default:
      component = <Landing />;
      break;
  }

  return component;
};

export default App;
