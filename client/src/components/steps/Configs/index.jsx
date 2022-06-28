import { Fragment } from "react";
import PageHeader from "../../PageHeader";
import System from "./System";
import itl from "../../../translations";
import { useStores } from "../../../data";

import "../../../styles/steps/configs.scss";

function Configs() {
  const { templateStore } = useStores();
  const systemTypes = templateStore.systemTypes;

  return (
    <Fragment>
      <PageHeader headerText="Configurations" />

      <div className="configs-page">
        <h4>{itl.phrases.addConfigs}</h4>

        {systemTypes.map((systemType) => {
          return (
            <System
              key={systemType.modelicaPath}
              systemPath={systemType.modelicaPath}
            />
          );
        })}
      </div>
    </Fragment>
  );
}

export default Configs;
