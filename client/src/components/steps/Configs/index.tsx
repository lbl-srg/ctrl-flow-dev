import { Fragment, useState } from "react";
import PageHeader from "../../PageHeader";
import System from "./System";

import { useStore } from "../../../store/store";

function Configs() {
  const { systemTypes, templates, configs } = useStore((state) => ({
    ...state,
    configs: state.getConfigs(),
    templates: state.getActiveTemplates(),
  }));

  return (
    <Fragment>
      <PageHeader headerText="Configurations" />
      <div>Add Configurations For The System Types You Selected</div>

      {systemTypes.map((systemT) => {
        const systemTypeTemplates = templates.filter(
          (t) => t.systemType.id === systemT.id,
        );
        const confs = configs.filter((c) =>
          systemTypeTemplates.map((s) => s.id).includes(c.template.id),
        );

        return systemTypeTemplates.length ? (
          <System
            key={systemT.id}
            systemType={systemT}
            templates={systemTypeTemplates}
            configs={confs}
          />
        ) : null;
      })}
    </Fragment>
  );
}

export default Configs;
