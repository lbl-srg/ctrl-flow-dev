import { useStore } from "../../../store/store";
import ConfigSlideOut from "../../modal/ConfigSlideOut";
import { useDebouncedCallback } from "use-debounce";

function Config({ config, template }) {
  const { removeConfig, updateConfig, toggleConfigLock } = useStore(
    (state) => state,
  );

  function remove(ev) {
    ev.preventDefault();
    removeConfig(config);
  }

  const updateName = useDebouncedCallback((ev) => {
    updateConfig(
      { ...config, name: ev.target.value },
      ev.target.value,
      config.selections,
    );
  }, 400);

  return (
    <div className="config" id={`config-${config.id}`} data-spy="config">
      <div className="input-container">
        <input
          type="text"
          onChange={updateName}
          placeholder="Enter Configuration Name"
          defaultValue={config.name}
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
