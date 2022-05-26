import { Fragment } from "react";
import PageHeader from "../../PageHeader";
import System from "./System";
import { useStores } from "../../../data";

import "../../../styles/steps/systems.scss";

const Systems = () => {
  const { templateStore } = useStores();

  return (
    <Fragment>
      <PageHeader headerText="Systems" />
      <h4>Select the systems types you will configure:</h4>

      <div className="systems-page">
        {templateStore.systemTypes.map((systemType) => (
          <System
            key={systemType.modelicaPath}
            systemPath={systemType.modelicaPath}
          />
        ))}
      </div>
    </Fragment>
  );
};

export default Systems;
