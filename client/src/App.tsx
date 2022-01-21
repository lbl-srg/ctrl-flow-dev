/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, css } from "@emotion/react/macro";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Configs from "./components/steps/Configs";
import Details from "./components/steps/Details";
import Landing from "./components/steps/Landing";
import Quantities from "./components/steps/Quantities";
import Results from "./components/steps/Results";
import Schedules from "./components/steps/Schedules";
import Systems from "./components/steps/Systems";
import { fonts } from "./styleHelpers";

const App = () => {
  return (
    <BrowserRouter>
      <div
        css={css`
          height: 100%;
          ${fonts}
        `}
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/details" element={<Details />} />
          <Route path="/systems" element={<Systems />} />
          <Route path="/configs" element={<Configs />} />
          <Route path="/quantities" element={<Quantities />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
