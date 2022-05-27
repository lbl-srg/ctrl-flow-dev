import ConfigSlideOut from "../../modal/ConfigSlideOut";
import Debug from "../../debug";
import { useDebouncedCallback } from "use-debounce";
import { useStores } from "../../../data";
import { observer } from "mobx-react";

const Config = observer(({ configId }) => {
  const { configStore } = useStores();
  const config = configStore.getById(configId);

  function remove(ev) {
    ev.preventDefault();
    configStore.remove(configId);
  }

  const updateName = useDebouncedCallback((ev) => {
    configStore.update(config.id, { name: ev.target.value });
  }, 400);

  return (
    <div className="config" id={`config-${configId}`} data-spy="config">
      {/* <Debug item={config} /> */}
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
            onClick={() => configStore.toggleConfigLock(configId)}
            className={
              config.isLocked
                ? "lock-toggle icon-lock"
                : "lock-toggle icon-lock-open"
            }
          />
          <ConfigSlideOut configId={config.id} />
        </div>
      </div>
      <a href="#" className="remove" onClick={remove}>
        <i className="icon-close" />
      </a>
    </div>
  );
});

export default Config;
