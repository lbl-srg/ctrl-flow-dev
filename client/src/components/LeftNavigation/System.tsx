import { SystemTemplate, SystemType, Configuration } from "../../store/store";
import Template from "./Template";
import { findIcon } from "./icon-mappings";
export interface SystemProps {
  systemType: SystemType;
  templates: SystemTemplate[];
  configs: Configuration[];
}

function System({ systemType, templates, configs }: SystemProps) {
  const classes = ["system"];
  if (!templates.length) classes.push("empty");

  const icon = findIcon(systemType.name);

  return (
    <details className={classes.join(" ")}>
      <summary>
        <a href={`#${systemType.name}`}>
          <div className="truncate">
            {icon && <i className={icon} />}
            {systemType.name}
          </div>
        </a>
      </summary>

      <ul className="templates">
        {templates.map((t) => (
          <Template
            key={t.id}
            template={t}
            configs={configs.filter((c) => c.template.id === t.id)}
          />
        ))}
      </ul>
    </details>
  );
}

export default System;
