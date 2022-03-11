import { useStore } from "../../../store/store";
import { findIcon } from "../../LeftNavigation/icon-mappings";

interface SystemProps {
  title: string;
  id: number;
  options: { id: number; text: string; checked: boolean }[];
}

function System({ id, title, options }: SystemProps) {
  const { getTemplates, addConfig, removeAllTemplateConfigs } = useStore(
    (state) => state,
  );

  const templates = getTemplates();
  const iconClass = findIcon(title);

  function onSelect(selection: string, checked: boolean) {
    const system = templates.find((s) => s.name === selection);
    if (system) {
      checked
        ? addConfig(system, { name: "Default" })
        : removeAllTemplateConfigs(system);
    }
  }

  return (
    <li className="system">
      <h2 id={`system-${id}`} data-spy="system">
        {iconClass && <i className={iconClass} />}
        {title}
      </h2>

      <ul>
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
                ></input>
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
