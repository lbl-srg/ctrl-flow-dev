import PageHeader from "../../PageHeader";
import AddUserSystemsWidget from "./AddUserSystemsWidget";
// import UserSystemTable from "./UserSystemTable";
import { Fragment, useState } from "react";
import itl from "../../../translations";

import "../../../styles/steps/schedules.scss";
import { useStores } from "../../../data";
import { observer } from "mobx-react";

const Schedules = observer(() => {
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
          {activeTemplate ? <AddUserSystemsWidget /> : null}
          {/* <button onClick={() => userSystems.map((s) => removeUserSystem(s))}>
          Remove Systems
        </button> */}
          {/* <UserSystemTable /> */}
        </div>
      </div>
    </Fragment>
  );
});

export default Schedules;
