import {
  SystemTemplate,
  SystemType,
  Configuration,
  MetaConfiguration,
} from "../../store/store";
import Template from "./Template";
import IconMapping from "./icon-mappings";
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

  const icon = IconMapping.find(
    (item) => item.systemName.toLowerCase() === systemType.name.toLowerCase(),
  );

  return (
    <details className={classes.join(" ")}>
      <summary>
        <a href={`/configs#${systemType.id}`}>
          <div className="truncate">
            {icon && <i className={icon.iconClass} />}
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
