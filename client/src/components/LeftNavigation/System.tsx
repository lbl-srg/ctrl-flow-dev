import {
  SystemTemplate,
  SystemType,
  Configuration,
  MetaConfiguration,
} from "../../store/store";
import Template from "./Template";
import { findIcon } from "./icon-mappings";
export interface SystemProps {
  systemType: SystemType;
  templates: SystemTemplate[];
  meta: MetaConfiguration[];
  setActiveTemplate: (template: SystemTemplate) => void;
}

function System({
  systemType,
  templates,
  meta,
  setActiveTemplate,
}: SystemProps) {
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
            meta={meta.filter((m) => m.config.template.id === t.id)}
            setActiveTemplate={setActiveTemplate}
          />
        ))}
      </ul>
    </details>
  );
}

export default System;
