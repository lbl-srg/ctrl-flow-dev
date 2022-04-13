import { MouseEvent, ChangeEvent, useState } from "react";
import { ConfigProps } from "./Types";
import { useStore } from "../../../store/store";
import ConfigSlideOut from "../../modal/ConfigSlideOut";
import { useDebouncedCallback } from "use-debounce";
import { updateNamedExports } from "typescript";

function Config({ config, template }: ConfigProps) {
  const { removeConfig, updateConfig, toggleConfigLock } = useStore(
    (state) => state,
  );

  const [configName, setConfigName] = useState(config.name);

  function remove(ev: MouseEvent) {
    ev.preventDefault();
    removeConfig(config);
  }

  const updateName = useDebouncedCallback((newName) => {
    updateConfig({ ...config, name: newName }, newName, config.selections);
  }, 500);

  function onChange(ev: ChangeEvent<HTMLInputElement>) {
    setConfigName(ev.target.value);
    updateName(ev.target.value);
  }

  return (
    <div className="config" id={`config-${config.id}`} data-spy="config">
      <div className="input-container">
        <input
          type="text"
          onInput={onChange}
          placeholder="Enter Configuration Name"
          defaultValue={configName}
          disabled={config.isLocked}
        />

        <div className="config-actions">
          <i
            className={
              config.isLocked
                ? "lock-toggle icon-lock"
                : "lock-toggle icon-lock-open"
            }
            onClick={() => toggleConfigLock(config.id)}
          />

          <ConfigSlideOut
            disabled={config.isLocked}
            template={template}
            config={config}
          />
        </div>
      </div>

      <a href="#" className="remove" onClick={remove}>
        <i className="icon-close" />
      </a>
    </div>
  );
}

export default Config;
