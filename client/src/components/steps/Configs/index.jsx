import { Fragment } from "react";
import PageHeader from "../../PageHeader";
import System from "./System";
import { useStore } from "../../../store/store";
import itl from "../../../translations";

import "../../../styles/steps/configs.scss";

function Configs() {
  const { getTemplatesForSystem, systemTypes } = useStore();

  return (
    <Fragment>
      <PageHeader headerText="Configurations" />

      <div className="configs-page">
        <h4>{itl.phrases.addConfigs}</h4>

        {systemTypes.map((systemType) => {
          const templates = getTemplatesForSystem(systemType);

          return (
            <System
              key={systemType.modelicaPath}
              systemType={systemType}
              templates={templates}
            />
          );
        })}
      </div>
    </Fragment>
  );
}

export default Configs;
