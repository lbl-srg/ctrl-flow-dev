import Template from "./Template";
import { useStores } from "../../../data";
import { observer } from "mobx-react";

import { SystemTypeInterface, TemplateInterface } from "../../../data/types";

export interface SystemProps {
  systemPath: string;
}

const System = observer(({ systemPath }: SystemProps) => {
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
        />
      ))}
    </div>
  );
});

export default System;
