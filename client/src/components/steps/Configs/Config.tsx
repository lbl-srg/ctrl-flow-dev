import { MouseEvent, ChangeEvent, Fragment, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { observer } from "mobx-react";

import SlideOutOpenButton from "./SlideOutOpenButton";
import SlideOut from "./SlideOut";
import { useStores } from "../../../data";

export interface ConfigProps {
  configId: string | undefined;
}

const Config = observer(({ configId }: ConfigProps) => {
  const { configStore, uiStore } = useStores();
  const config = configStore.getById(configId);

  function removeConfiguration(event: MouseEvent) {
    event.preventDefault();
    configStore.remove(configId);
  }

  const updateName = useDebouncedCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      configStore.update(config.id, { name: event.target.value });
    },
    400,
  );

  const [openedModal, setOpenedModal] = useState(false);
  function openModal() {
    setOpenedModal(true);
    uiStore.setOpenSystemPath(config.systemPath);
  }

  return (
    <Fragment>
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
            <SlideOutOpenButton
              disabled={config.isLocked}
              onClick={openModal}
            />
          </div>
        </div>
        <a href="#" className="remove" onClick={removeConfiguration}>
          <i className="icon-close" />
        </a>
      </div>
      {openedModal && (
        <SlideOut configId={config.id} close={() => setOpenedModal(false)} />
      )}
    </Fragment>
  );
});

export default Config;
