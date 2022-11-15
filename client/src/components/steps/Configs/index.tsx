import { Fragment } from "react";
import PageHeader from "../../PageHeader";
import System from "./System";
import itl from "../../../translations";
import { useStores } from "../../../data";

import "../../../styles/steps/configs.scss";

import { SystemTypeInterface } from "../../../data/template";

const Configs = () => {
  const { templateStore } = useStores();
  const systemTypes: SystemTypeInterface[] = templateStore.systemTypes;

  return (
    <Fragment>
      <PageHeader headerText="Configurations" />
      <div className="configs-page">
        <h4>{itl.phrases.addConfigs}</h4>
        {systemTypes.map((systemType) => (
          <System
            key={systemType.modelicaPath}
            systemPath={systemType.modelicaPath}
          />
        ))}
      </div>
    </Fragment>
  );
};

export default Configs;
