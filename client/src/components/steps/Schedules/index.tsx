import PageHeader from "../../PageHeader";
import AddUserSystemsWidget from "./AddUserSystemsWidget";
import UserSystemTable from "./UserSystemTable";
import { Fragment, useState } from "react";
import itl from "../../../translations";

import "../../../styles/steps/schedules.scss";
import { useStores } from "../../../data";

function Schedules() {
  // Order of attempting to get a currently active template:
  // 1. try the 'activeTemplate' from the store
  // 2. otherwise get the first config found and get its template
  // 3. leave undefined - no configs or user systems will show
  // const [firstConf] = configs;
  // const activeTemplate = template ? template : firstConf?.template;

  // const templateConfigs = getConfigs(activeTemplate);
  // const userSystems = getUserSystems(activeTemplate);
  const { uiStore } = useStores();
  const activeTemplate = uiStore.activeTemplate;

  const [isFullscreen, setFullscreen] = useState(false);

  return (
    <Fragment>
      <PageHeader headerText="Equipment Schedules" />

      <div className="schedules-page">
        <h4>{itl.phrases.scheduleInstruct}</h4>

        <div
          className={
            isFullscreen
              ? "schedule-container fullscreen"
              : "schedule-container"
          }
        >
          <h3 className="with-links">
            {activeTemplate?.name}
            <div className="links">
              <a onClick={() => setFullscreen(!isFullscreen)}>
                <i
                  className={
                    isFullscreen ? "icon-fullscreen-exit" : "icon-fullscreen"
                  }
                />
                {itl.terms.toggleFullscreen}
              </a>
              <a>
                <i className="icon-upload" />
                {itl.terms.upload}
              </a>
              <a>
                <i className="icon-download" />
                {itl.terms.download}
              </a>
            </div>
          </h3>

          {/* <AddUserSystemsWidget configs={templateConfigs} /> */}
          {/* <button onClick={() => userSystems.map((s) => removeUserSystem(s))}>
          Remove Systems
        </button> */}
          {/* <UserSystemTable userSystems={userSystems} /> */}
        </div>
      </div>
    </Fragment>
  );
}

export default Schedules;
