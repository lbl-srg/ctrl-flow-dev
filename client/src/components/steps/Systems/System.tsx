import { useStores } from "../../../data";
import { observer } from "mobx-react";
import { OptionInterface } from "../../../data/template";

const System = observer(({ systemPath }: { systemPath: string }) => {
  const { uiStore, configStore, templateStore } = useStores();

  const { description } = templateStore.getSystemTypeByPath(systemPath);
  const templates = templateStore.getTemplatesForSystem(systemPath);
  const iconClass = templateStore.getIconForSystem(systemPath);

  function onSelect(option: OptionInterface, checked: boolean) {
    uiStore.setOpenSystemPath(systemPath);
    uiStore.setActiveSystemPath(systemPath);

    const templatePath = option.modelicaPath;

    if (checked) configStore.add({ systemPath, templatePath });
    else configStore.removeAllForSystemTemplate(systemPath, templatePath);
  }

  return (
    <li className="system" id={`system-${systemPath}`} data-spy="system">
      <h2 className="system-header">
        {iconClass && <i className={iconClass} />}
        {description}
      </h2>

      <ul className="check-list">
        {templates.map((option: OptionInterface) => {
          const { name, modelicaPath } = option;

          const checked = configStore.hasSystemTemplateConfigs(
            systemPath,
            modelicaPath,
          );

          return (
            <li
              className="template"
              key={modelicaPath}
              id={`template-${modelicaPath}`}
              data-spy={checked ? "template" : "disabled"}
            >
              <label>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onSelect(option, e.target.checked)}
                />
                {name}
                <i className="icon-info-circled" />
              </label>
            </li>
          );
        })}
      </ul>
    </li>
  );
});

export default System;
