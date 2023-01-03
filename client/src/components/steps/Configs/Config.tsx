import { MouseEvent, ChangeEvent, Fragment, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { observer } from "mobx-react";

import SlideOutOpenButton from "./SlideOutOpenButton";
import SlideOut from "./SlideOut";
import { useStores } from "../../../data";

import { OptionInterface, TemplateInterface } from "../../../data/template";
import { Modifiers, ConfigValues } from "../../../utils/modifier-helpers";
import { ConfigInterface } from "../../../data/config";
import Spinner from '../../Spinner';

export interface ConfigProps {
  configId: string | undefined;
  projectSelections: ConfigValues;
  projectEvaluatedValues: ConfigValues;
}

const Config = observer(({ configId, projectSelections, projectEvaluatedValues }: ConfigProps) => {
  const { configStore, templateStore, uiStore } = useStores();
  const config = configStore.getById(configId) as ConfigInterface;
  const template = templateStore.getTemplateByPath(
    config.templatePath,
  ) as TemplateInterface;
  const templateOptions: OptionInterface[] =
    templateStore.getOptionsForTemplate(template?.modelicaPath);
  const templateModifiers: Modifiers = templateStore.getModifiersForTemplate(
    template?.modelicaPath,
  );
  const selections: ConfigValues = configStore.getConfigSelections(configId);
  const allOptions: { [key: string]: OptionInterface } =
    templateStore.getAllOptions();

  const [openedModal, setOpenedModal] = useState<boolean>(false);
  const [isLoading, setLoading] = useState<boolean>(false);

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

  function openModal() {
    setLoading(true);
  }

  useEffect(() => {
    if (isLoading && !openedModal) {
      setOpenedModal(true);
      uiStore.setOpenSystemPath(config.systemPath);
    }
  }, [isLoading]);

  return (
    <Fragment>
      <Spinner
        loading={isLoading}
        text="Please wait..."
      />
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
            {/*<i
              onClick={() => configStore.toggleConfigLock(configId)}
              className={
                config.isLocked
                  ? "lock-toggle icon-lock"
                  : "lock-toggle icon-lock-open"
              }
            />*/}
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
          projectSelections={projectSelections}
          projectEvaluatedValues={projectEvaluatedValues}
          template={template}
          templateOptions={templateOptions} 
          templateModifiers={templateModifiers}
          selections={selections}
          allOptions={allOptions}
          // startLoading={() => setLoading(true)}
          stopLoading={() => setLoading(false)}
          close={() => setOpenedModal(false)}
        />
      )}
    </Fragment>
  );
});

export default Config;
