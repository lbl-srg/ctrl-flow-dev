import { Fragment } from "react";
import PageHeader from "../../PageHeader";
import System from "./System";
import { useStore } from "../../../store/store";

import "../../../styles/steps/configs.scss";

function Configs() {
  const { systemTypes, templates, configs } = useStore((state) => ({
    ...state,
    configs: state.getConfigs(),
    templates: state.getActiveTemplates(),
  }));

  return (
    <Fragment>
      <PageHeader headerText="Configurations" />

      <div className="configs-page">
        <h4>Add Configurations For The System Types You Selected</h4>

        {systemTypes.map((systemT) => {
          const systemTypeTemplates = templates.filter(
            (t) => t.systemType.id === systemT.id,
          );

          return (
            <System
              key={systemT.id}
              systemType={systemT}
              templates={systemTypeTemplates}
            />
          );
        })}
      </div>
    </Fragment>
  );
}

export default Configs;
