import { Fragment } from "react";
import PageHeader from "../../PageHeader";
import System from "./System";
import itl from "../../../translations";
import { useStores } from "../../../data";

import "../../../styles/steps/configs.scss";

import { SystemTypeInterface } from "../../../data/template";
import { ConfigValues } from "../../../utils/modifier-helpers";

const Configs = () => {
  const { projectStore, templateStore } = useStores();
  const systemTypes: SystemTypeInterface[] = templateStore.systemTypes;
  const projectSelections: ConfigValues = projectStore.getProjectSelections();
  const projectEvaluatedValues: ConfigValues = projectStore.getProjectEvaluatedValues();

  return (
    <Fragment>
      <PageHeader headerText="Configurations" />
      <div className="configs-page">
        <h4>{itl.phrases.addConfigs}</h4>
        {systemTypes.map((systemType) => (
          <System
            key={systemType.modelicaPath}
            systemPath={systemType.modelicaPath}
            projectSelections={projectSelections}
            projectEvaluatedValues={projectEvaluatedValues}
          />
        ))}
      </div>
    </Fragment>
  );
};

export default Configs;
