import { SystemProps } from "./Types";
import Template from "./Template";

const System = ({ systemType, templates, configs }: SystemProps) => {
  return (
    <article>
      <h3>{systemType.name}</h3>

      {templates.map((template) => (
        <Template
          key={template.id}
          template={template}
          configs={configs.filter((c) => c.template.id === template.id)}
        />
      ))}
    </article>
  );
};

export default System;
