import { Fragment } from "react";
import PageHeader from "../../PageHeader";
import { useStore } from "../../../store/store";
import System from "./System";

import "../../../styles/steps/systems.scss";

const Systems = () => {
  const { systemTypes, activeTemplates, getTemplatesForSystem } = useStore(
    (state) => {
      return {
        ...state,

        templates: state.getTemplates(),
        activeTemplates: state.getActiveTemplates(),
        activeTemplate: state.getActiveTemplate(),
      };
    },
  );

  return (
    <Fragment>
      <PageHeader headerText="Systems" />
      <h4>Select the systems types you will configure:</h4>

      <div className="systems-page">
        {systemTypes.map((systemType) => (
          <System
            key={systemType.modelicaPath}
            title={systemType.description}
            modelicaPath={systemType.modelicaPath}
            options={getTemplatesForSystem(systemType)}
          />
        ))}
      </div>
    </Fragment>
  );
};

export default Systems;
