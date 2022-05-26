import Template from "./Template";
import { useStores } from "../../../data";

const System = ({ systemType, templates }) => {
  const { templateStore } = useStores();
  const icon = templateStore.getIconForSystem(systemType.modelicaPath);

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
