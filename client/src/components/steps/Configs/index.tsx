import { Fragment, useState } from "react";
import PageHeader from "../../PageHeader";
import SystemType from "./SystemType";
import { useStore } from "../../../store/store";

function Configs() {
  const { systemTypes, addConfig, removeConfig, configs, templates } = useStore(
    (state) => ({
      ...state,
      configs: state.getConfigs(),
      templates: state.getActiveTemplates(),
    }),
  );

  // based on user configs, figure out which templates they are using

  return (
    <Fragment>
      <PageHeader headerText="Configurations" />

      <div>Add Configurations For The System Types You Selected</div>
      <ul>
        {systemTypes.map((systemType) => {
          // const systemTypeTemplates = templates.filter(
          //   (t) => t.systemType.id === systemT.id,
          // );
          // const confs = configs.filter((c) =>
          //   systemTypeTemplates.map((s) => s.id).includes(c.template.id),
          // );
          return (
            <SystemType key={systemType.id} systemType={systemType} />
            // <SystemConfigGroup
            //   key={systemT.id}
            //   systemType={systemT}
            //   templates={systemTypeTemplates}
            //   configs={confs}
            //   addConfig={addConfig}
            //   removeConfig={removeConfig}
            // />
          );
        })}
      </ul>
    </Fragment>
  );
}

export default Configs;
