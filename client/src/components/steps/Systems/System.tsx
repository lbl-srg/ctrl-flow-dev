import { useStore } from "../../../store/store";
import { findIcon } from "../../LeftNavigation/icon-mappings";

interface SystemProps {
  title: string;
  options: { text: string; checked: boolean }[];
}

function System({ title, options }: SystemProps) {
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
    <li className="system" key={title}>
      <h2 id={title}>
        {iconClass && <i className={iconClass} />}
        {title}
      </h2>

      <ul>
        {options.map(({ text, checked }) => {
          const id = text;

          return (
            <li className="template" key={id} id={id}>
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
