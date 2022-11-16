import { MouseEvent, ChangeEvent, Fragment, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { observer } from "mobx-react";

import SlideOutOpenButton from "./SlideOutOpenButton";
import SlideOut, { ConfigValues } from "./SlideOut";
import { useStores } from "../../../data";

import { OptionInterface } from "../../../data/template";
import { Modifiers } from "../../../utils/modifier-helpers";

export interface ConfigProps {
  configId: string | undefined;
}

const Config = observer(({ configId }: ConfigProps) => {
  const { configStore, templateStore, uiStore } = useStores();
  const config = configStore.getById(configId);
  const template = templateStore.getTemplateByPath(config.templatePath);
  const templateOptions: OptionInterface[] = templateStore.getOptionsForTemplate(
    template?.modelicaPath,
  );
  const templateModifiers: Modifiers = templateStore.getModifiersForTemplate(
    template?.modelicaPath,
  );
  const selections: ConfigValues = configStore.getConfigSelections(configId);
  const allOptions: OptionInterface[] = templateStore.getAllOptions();

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
        <SlideOut
          config={config}
          template={template}
          templateOptions={templateOptions}
          templateModifiers={templateModifiers}
          selections={selections}
          allOptions={allOptions}
          close={() => setOpenedModal(false)}
        />
      )}
    </Fragment>
  );
});

export default Config;
