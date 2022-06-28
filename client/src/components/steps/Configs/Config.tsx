import ConfigSlideOut from "./ConfigSlideOut";
import { useDebouncedCallback } from "use-debounce";
import { useStores } from "../../../data";
import { observer } from "mobx-react";
import { MouseEvent } from "react";

const Config = observer(({ configId }: { configId: string }) => {
  const { configStore } = useStores();
  const config = configStore.getById(configId);

  function remove(ev: MouseEvent) {
    ev.preventDefault();
    configStore.remove(configId);
  }

  const updateName = useDebouncedCallback((ev) => {
    configStore.update(config.id, { name: ev.target.value });
  }, 400);

  return (
    <div className="config" id={`config-${configId}`} data-spy="config">
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
