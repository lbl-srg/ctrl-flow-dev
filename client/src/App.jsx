import { Route, Routes, useLocation } from "react-router-dom";
import Configs from "./components/steps/Configs";
import Landing from "./components/steps/Landing";
import Results from "./components/steps/Results";
import Schedules from "./components/steps/Schedules";
import Systems from "./components/steps/Systems";
import Sidebarlayout from "./components/layouts/SidebarLayout";
import LeftNav from "./components/LeftNavigation";
import { autorun } from "mobx";
import { observer } from "mobx-react";

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
        </Routes>
      }
    />
  );
};

export default App;
