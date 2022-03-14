import { Fragment } from "react";
import PageHeader from "../../PageHeader";
import { useStore } from "../../../store/store";
import AddUserSystemsWidget from "./AddUserSystemsWidget";
import UserSystemTable from "./UserSystemTable";

function Schedules() {
  const { template, configs } = useStore((state) => ({
    template: state.getActiveTemplate(),
    configs: state.getConfigs(),
  }));

  // Order of attempting to get a currently active template:
  // 1. try the 'activeTemplate' from the store
  // 2. otherwise get the first config found and get its template
  // 3. leave undefined - no configs or user systems will show
  const [firstConf, ..._rest] = configs;
  const activeTemplate = template ? template : firstConf?.template;
  const templateConfigs = activeTemplate
    ? configs.filter((c) => c.template.id === activeTemplate.id)
    : configs;
  const userSystems = useStore((state) => state.getUserSystems(template));
  const removeUserSystem = useStore((state) => state.removeUserSystem);

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
