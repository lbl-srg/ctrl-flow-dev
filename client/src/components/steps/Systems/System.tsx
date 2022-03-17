import { useStore } from "../../../store/store";
import { findIcon } from "../../LeftNavigation/icon-mappings";

interface SystemProps {
  title: string;
  id: number;
  options: { id: number; text: string; checked: boolean }[];
}

function System({ id, title, options }: SystemProps) {
  const {
    getTemplates,
    addConfig,
    getConfigs,
    removeAllTemplateConfigs,
    addUserSystems,
  } = useStore((state) => state);

  const templates = getTemplates();
  const iconClass = findIcon(title);

  function onSelect(selection: string, checked: boolean) {
    const template = templates.find((s) => s.name === selection);
    if (template) {
      if (checked) {
        addConfig(template, { name: "Default" });
        const [config, ..._rest] = getConfigs(template);
        addUserSystems(template.name, 1, 1, config);
      } else {
        removeAllTemplateConfigs(template);
      }
    }
  }

  return (
    <li className="system" id={`system-${id}`} data-spy="system">
      <h2 className="system-header">
        {iconClass && <i className={iconClass} />}
        {title}
      </h2>

      <ul className="check-list">
        {options.map((option) => {
          const { text, checked, id } = option;

          return (
            <li
              className="template"
              key={id}
              id={`template-${id}`}
              data-spy={checked ? "template" : "disabled"}
            >
              <label>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onSelect(text, e.target.checked)}
                />
                {text}
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
