import { Route, Routes, useLocation } from "react-router-dom";
import Configs from "./components/steps/Configs";
import Details from "./components/steps/Details";
import Landing from "./components/steps/Landing";
import Results from "./components/steps/Results";
import Schedules from "./components/steps/Schedules";
import Systems from "./components/steps/Systems";
import Sidebarlayout from "./components/layouts/SidebarLayout";
import LeftNav from "./components/LeftNavigation";

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
          <Route path="/details" element={<Details />} />
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
