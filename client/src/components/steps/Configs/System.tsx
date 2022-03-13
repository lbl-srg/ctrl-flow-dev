import { Fragment } from "react";
import { SystemProps } from "./Types";
import Template from "./Template";
import { findIcon } from "../../LeftNavigation/icon-mappings";

const System = ({ systemType, templates, configs }: SystemProps) => {
  const icon = findIcon(systemType.name) || "";

  return (
    <div className="system" id={`system-${systemType.id}`} data-spy="system">
      <h2 className="system-header">
        <i className={icon} />
        {systemType.name}
      </h2>

      <article>
        {templates.map((template) => (
          <Template
            key={template.id}
            template={template}
            configs={configs.filter((c) => c.template.id === template.id)}
          />
        ))}
      </article>
    </div>
  );
};

export default System;
