import { Route, Routes, useLocation } from "react-router-dom";
import Sidebarlayout from "./components/layouts/SidebarLayout";
import LeftNav from "./components/LeftNavigation";
import Landing from "./components/steps/Landing";
import Systems from "./components/steps/Systems";
import Configs from "./components/steps/Configs/index";
import Schedules from "./components/steps/Schedules";
import Results from "./components/steps/Results";
import Sequence from "./components/steps/Results/Sequence";

import "./styles/application.scss";

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
          <Route path="/results/sequence" element={<Sequence />} />
        </Routes>
      }
    />
  );
};

export default App;
