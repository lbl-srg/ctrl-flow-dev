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
        <p className="lead">
          Add Configurations For The System Types You Selected
        </p>

        {systemTypes.map((systemT) => {
          const systemTypeTemplates = templates.filter(
            (t) => t.systemType.id === systemT.id,
          );
          const confs = configs.filter((c) =>
            systemTypeTemplates.map((s) => s.id).includes(c.template.id),
          );

          return (
            <System
              key={systemT.id}
              systemType={systemT}
              templates={systemTypeTemplates}
              configs={confs}
            />
          );
        })}
      </div>
    </Fragment>
  );
}

export default Configs;
