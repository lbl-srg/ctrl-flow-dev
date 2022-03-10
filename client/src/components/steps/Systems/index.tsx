import { Fragment } from "react";
import PageHeader from "../../PageHeader";
import { useStore } from "../../../store/store";
import System from "./System";
import { useEffect } from "react";

import "../../../styles/steps/systems.scss";

const Systems = () => {
  const {
    getTemplates,
    systemTypes,
    getActiveTemplate,
    getActiveTemplates,
    activeSystemId,
  } = useStore((state) => state);

  const templates = getTemplates();
  const activeTemplates = getActiveTemplates();
  const activeTemplate = getActiveTemplate();

  useEffect(() => {
    let $el;
    if (activeTemplate)
      $el = document.querySelector(`#template-${activeTemplate.id}`);
    else if (activeSystemId)
      $el = document.querySelector(`#system-${activeSystemId}`);

    if ($el) $el?.scrollIntoView({ behavior: "smooth" });
  }, [activeSystemId, activeTemplate]);

  return (
    <Fragment>
      <PageHeader headerText="Systems" />
      <h4>Select the systems types you will configure:</h4>

      <div className="systems-page">
        {systemTypes.map((systemType) => (
          <System
            key={systemType.id}
            title={systemType.name}
            id={systemType.id}
            options={templates
              .filter((tpl) => tpl.systemType.id === systemType.id)
              .map((sys) => {
                const exists = activeTemplates.find(
                  (userS) => userS.id === sys.id,
                );
                return {
                  id: sys.id,
                  text: sys.name,
                  checked: exists ? true : false,
                };
              })}
          />
        ))}
      </div>
    </Fragment>
  );
};

export default Systems;
