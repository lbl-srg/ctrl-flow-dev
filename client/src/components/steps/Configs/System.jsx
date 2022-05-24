import Template from "./Template";
import { findIcon } from "../../LeftNavigation/icon-mappings";

const System = ({ systemType, templates }) => {
  const icon = findIcon(systemType.name) || "";

  return (
    <div className="system" id={`system-${systemType.id}`} data-spy="system">
      <h2 className="system-header">
        <i className={icon} />
        {systemType.name}
      </h2>

      {templates.map((template) => (
        <Template key={template.id} template={template} />
      ))}
    </div>
  );
};

export default System;
