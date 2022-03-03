import { SystemTemplate, SystemType, Configuration } from "../../store/store";
import Template from "./Template";

export interface SystemProps {
  systemType: SystemType;
  templates: SystemTemplate[];
  configs: Configuration[];
}

function System({ systemType, templates, configs }: SystemProps) {
  const classes = ["system"];
  if (!templates.length) classes.push("empty");

  return (
    <details className={classes.join(" ")}>
      <summary>
        <a href={`/configs#${systemType.id}`}>{systemType.name}</a>
      </summary>

      {configs.length && (
        <ul className="templates">
          {templates.map((t) => (
            <Template
              key={t.id}
              template={t}
              configs={configs.filter((c) => c.template.id === t.id)}
            />
          ))}
        </ul>
      )}
    </details>
  );
}

export default System;
