import { Fragment } from "react";
import PageHeader from "../../PageHeader";
import { useStore } from "../../../store/store";
import System from "./System";
import "../../../styles/steps/systems.scss";

const Systems = () => {
  const { getTemplates, systemTypes, getActiveTemplates } = useStore(
    (state) => state,
  );

  const templates = getTemplates();
  const activeTemplates = getActiveTemplates();

  return (
    <Fragment>
      <PageHeader headerText="Systems" />
      <h4>Select the systems types you will configure:</h4>

      <div className="systems-page">
        {systemTypes.map((systemType) => (
          <System
            key={systemType.id}
            title={systemType.name}
            options={templates
              .filter((tpl) => tpl.systemType.id === systemType.id)
              .map((sys) => {
                const exists = activeTemplates.find(
                  (userS) => userS.id === sys.id,
                );
                return { text: sys.name, checked: exists ? true : false };
              })}
          />
        ))}
      </div>
    </Fragment>
  );
};

export default Systems;
