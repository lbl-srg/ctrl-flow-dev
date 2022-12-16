import Template from "./Template";
import { useStores } from "../../../data";
import { observer } from "mobx-react";

import { SystemTypeInterface, TemplateInterface } from "../../../data/template";
import { ConfigValues } from "../../../utils/modifier-helpers";

export interface SystemProps {
  systemPath: string;
  projectSelections: ConfigValues;
  projectEvaluatedValues: ConfigValues;
}

const System = observer(({ systemPath, projectSelections, projectEvaluatedValues }: SystemProps) => {
  const { templateStore } = useStores();

  const { system, templates, icon } = {
    system: templateStore.getSystemTypeByPath(
      systemPath,
    ) as SystemTypeInterface,
    templates: templateStore.getActiveTemplatesForSystem(systemPath),
    icon: templateStore.getIconForSystem(systemPath),
  };

  return (
    <div className="system" id={`system-${systemPath}`} data-spy="system">
      <h2 className="system-header">
        <i className={icon} />
        {system.description}
      </h2>

      {templates.map((template: TemplateInterface) => (
        <Template
          key={template.modelicaPath}
          systemPath={systemPath}
          templatePath={template.modelicaPath}
          projectSelections={projectSelections}
          projectEvaluatedValues={projectEvaluatedValues}
        />
      ))}
    </div>
  );
});

export default System;
