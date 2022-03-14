import { MouseEvent, ChangeEvent, useState } from "react";
import { ConfigProps } from "./Types";
import { useStore } from "../../../store/store";
import ConfigSlideOut from "../../modal/ConfigSlideOut";

function Config({ config, template }: ConfigProps) {
  const { removeConfig, updateConfig, toggleConfigLock } = useStore((state) => {
    // debugger;
    return state;
  });

  function remove(ev: MouseEvent) {
    ev.preventDefault();
    removeConfig(config);
  }

  function updateName(ev: ChangeEvent<HTMLInputElement>) {
    const configName = ev.target.value;
    updateConfig(
      { ...config, name: ev.target.value },
      configName,
      config.selections,
    );
  }

  return (
    <div className="config">
      <div className="input-container">
        <input
          type="text"
          onInput={updateName}
          placeholder="Enter Configuration Name"
          value={config.name}
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
        <i className="icon-cross" />
      </a>
    </div>
  );
}

export default Config;
