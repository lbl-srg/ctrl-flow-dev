import { SystemTemplate, SystemType, Configuration } from "../../store/store";
import Template from "./Template";

export interface SystemProps {
  systemType: SystemType;
  templates: SystemTemplate[];
  configs: Configuration[];
}

function System({ systemType, templates, configs }: SystemProps) {
  return (
    <li className="system">
      <a href={`/configs#${systemType.id}`}>{systemType.name}</a>
      <ul>
        {templates.map((t) => (
          <Template
            key={t.id}
            template={t}
            configs={configs.filter((c) => c.template.id === t.id)}
          />
        ))}
      </ul>
    </li>
  );
}

export default System;
