import { findIcon } from "../../LeftNavigation/icon-mappings";
import { useStores } from "../../../data";

function System({ systemPath, title, options }) {
  const { uiStore, configStore } = useStores();

  // const templates = getTemplates();
  const iconClass = findIcon(title);

  function onSelect(option, checked) {
    uiStore.setOpenSystemPath(systemPath);
    uiStore.setActiveSystemPath(systemPath);

    if (checked) {
      configStore.addUserConfig(systemPath, {
        templatePath: option.modelicaPath,
      });
    } else {
      configStore.removeAllConfigsForTemplate(systemPath, option.modelicaPath);
    }
  }

  return (
    <li className="system" id={`system-${systemPath}`} data-spy="system">
      <h2 className="system-header">
        {iconClass && <i className={iconClass} />}
        {title}
      </h2>

      <ul className="check-list">
        {options.map((option) => {
          const { name, checked, modelicaPath } = option;

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
}

export default System;
