import PageHeader from "../../PageHeader";
import { useStore } from "../../../store/store";
import AddUserSystemsWidget from "./AddUserSystemsWidget";
import UserSystemTable from "./UserSystemTable";
import { Fragment } from "react";

import "../../../styles/steps/schedules.scss";

function Schedules() {
  const { getConfigs, getUserSystems, removeUserSystem, template, configs } =
    useStore((state) => ({
      ...state,
      template: state.getActiveTemplate(),
      configs: state.getConfigs(),
    }));

  // Order of attempting to get a currently active template:
  // 1. try the 'activeTemplate' from the store
  // 2. otherwise get the first config found and get its template
  // 3. leave undefined - no configs or user systems will show
  const [firstConf] = configs;
  const activeTemplate = template ? template : firstConf?.template;

  const templateConfigs = getConfigs(activeTemplate);
  const userSystems = getUserSystems(activeTemplate);

  return (
    <Fragment>
      <PageHeader headerText="Equipment Schedules" />

      <div className="schedules-page">
        <p className="lead">
          Add tags, IDs, and quantities for your selected systems. Edit your
          system&apos;s schedule directly from the table.
        </p>
        <h3 className="with-links">
          {activeTemplate?.name}
          <div className="links">
            <a>
              <i className="icon-upload" />
              Upload
            </a>
            <a>
              <i className="icon-download" />
              Download
            </a>
          </div>
        </h3>

        <AddUserSystemsWidget configs={templateConfigs} />
        {/* <button onClick={() => userSystems.map((s) => removeUserSystem(s))}>
          Remove Systems
        </button> */}
        <UserSystemTable userSystems={userSystems} />
      </div>
    </Fragment>
  );
}

export default Schedules;
