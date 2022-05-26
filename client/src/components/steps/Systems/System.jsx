import { useStores } from "../../../data";

function System({ systemPath }) {
  const { uiStore, configStore, templateStore } = useStores();

  const { title } = templateStore.getSystemTypeByPath(systemPath);
  const templates = templateStore.getTemplatesForSystem(systemPath);
  const iconClass = templateStore.getIconForSystem(systemPath);

  function onSelect(option, checked) {
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
        {title}
      </h2>

      <ul className="check-list">
        {templates.map((option) => {
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
