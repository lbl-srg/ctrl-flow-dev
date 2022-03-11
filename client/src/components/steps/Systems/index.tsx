import { Fragment } from "react";
import PageHeader from "../../PageHeader";
import { useStore } from "../../../store/store";
import System from "./System";
import { useEffect } from "react";

import "../../../styles/steps/systems.scss";

const Systems = () => {
  const { systemTypes, activeTemplates, templates } = useStore((state) => {
    return {
      ...state,
      templates: state.getTemplates(),
      activeTemplates: state.getActiveTemplates(),
      activeTemplate: state.getActiveTemplate(),
    };
  });

  // useEffect(() => {
  //   let $el;
  //   if (scrollToTemplateId)
  //     $el = document.querySelector(`#template-${scrollToTemplateId}`);

  //   if ($el) $el?.scrollIntoView({ behavior: "smooth" });
  // }, [scrollToTemplateId]);

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
