import { Route, Routes, useLocation } from "react-router-dom";
import Configs from "./components/steps/Configs/index";
import Landing from "./components/steps/Landing";
import Results from "./components/steps/Results/index";
import Schedules from "./components/steps/Schedules";
import Systems from "./components/steps/Systems";
import Sidebarlayout from "./components/layouts/SidebarLayout";
import LeftNav from "./components/LeftNavigation";

import "./styles/application.scss";

import templates from "./templates/system-template-test-package.json";
console.log(templates);

const App = () => {
  const location = useLocation();
  const isFullScreen = ["/"].includes(location.pathname);

  return (
    <Sidebarlayout
      isFullScreen={isFullScreen}
      contentLeft={<LeftNav />}
      contentRight={
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/systems" element={<Systems />} />
          <Route path="/configs" element={<Configs />} />
          <Route path="/schedules" element={<Schedules />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      }
    />
  );
};

export default App;
