import { Fragment } from "react";
import PageHeader from "../../PageHeader";
import { useStore } from "../../../store/store";
import AddUserSystemsWidget from "./AddUserSystemsWidget";
import UserSystemTable from "./UserSystemTable";

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
  const userSystems = getUserSystems(template);

  return (
    <Fragment>
      <PageHeader headerText="Schedules" />
      <AddUserSystemsWidget configs={templateConfigs} />
      <button onClick={() => userSystems.map((s) => removeUserSystem(s))}>
        Remove Systems
      </button>
      <UserSystemTable userSystems={userSystems} />
    </Fragment>
  );
}

export default Schedules;
