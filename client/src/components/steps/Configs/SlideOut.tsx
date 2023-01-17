import { ChangeEvent, FormEvent, Fragment, useEffect, useState } from "react";

import itl from "../../../translations";
import { useStores } from "../../../data";
import { OptionInterface } from "../../../data/template";
import Modal from "../../modal/Modal";
import OptionSelect from "./OptionSelect";
import { mapToDisplayOptions as mapConfigContextToDisplayOptions } from "../../../interpreter/display-option";
import { ConfigContext } from "../../../interpreter/interpreter";
import { useDebouncedCallback } from "use-debounce";

import {
  applyOptionModifier,
  applyValueModifiers,
  applyVisibilityModifiers,
  Modifiers,
  getUpdatedModifiers,
  ConfigValues,
} from "../../../utils/modifier-helpers";

import { removeEmpty } from "../../../utils/utils";

import "../../../styles/components/config-slide-out.scss";

export interface FlatConfigOptionGroup {
  groupName: string;
  selectionPath: string;
  items: (FlatConfigOptionGroup | FlatConfigOption)[];
}

export interface FlatConfigOption {
  parentModelicaPath: string;
  modelicaPath: string;
  name: string;
  choices?: OptionInterface[];
  booleanChoices?: string[];
  value: any;
  scope: string;
  selectionType: string;
}

export interface FlatConfigOptionChoice {
  modelicaPath: string;
  name: string;
}

export interface ConfigSlideOutProps {
  config: any;
  projectSelections: ConfigValues;
  projectEvaluatedValues: ConfigValues;
  template: any;
  templateOptions: OptionInterface[];
  templateModifiers: Modifiers;
  selections: ConfigValues;
  allOptions: { [key: string]: OptionInterface };
  // startLoading: () => void;
  stopLoading: () => void;
  close: () => void;
}

const SlideOut = ({
  config,
  projectSelections,
  projectEvaluatedValues,
  template,
  templateOptions,
  templateModifiers,
  selections,
  allOptions,
  // startLoading,
  stopLoading,
  close,
}: ConfigSlideOutProps) => {
  const { configStore, templateStore } = useStores();
  const [selectedValues, setSelectedValues] = useState<ConfigValues>({
    ...selections,
    ...projectSelections,
  });
  const [configName, setConfigName] = useState<string>(config.name);

  const context = new ConfigContext(
    template,
    config,
    allOptions,
    selectedValues,
  );

  useEffect(() => {
    stopLoading();
  }, []);

  // const updateConfigName = useDebouncedCallback(
  //   (event: ChangeEvent<HTMLInputElement>) => {
  //     setConfigName(event.target.value);
  //   },
  //   1000,
  // );

  function updateSelectedConfigOption(
    parentModelicaPath: string,
    scope: string,
    choice: string | null,
  ) {
    // startLoading();
    setSelectedValues((prevState: any) => {
      const selectionPath = `${parentModelicaPath}-${scope}`;

      if (choice === null) {
        delete prevState[selectionPath];
        return prevState;
      }

      return {
        ...prevState,
        [selectionPath]: choice,
      };
    });
  }

  // TODO: I think the context cache can work for this
  const evaluatedValues = {};

  function saveConfigOptions(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();

    // configStore.update(config.id, { name: configName });
    configStore.setSelections(config.id, selectedValues);
    configStore.setEvaluatedValues(config.id, removeEmpty(evaluatedValues));

    close();
  }

  const displayedOptions = mapConfigContextToDisplayOptions(context);

  function renderDisplayOptions(
    items: (FlatConfigOptionGroup | FlatConfigOption)[],
  ) {
    return items.map(
      (option: FlatConfigOptionGroup | FlatConfigOption, index) => {
        if ("groupName" in option) {
          const optionGroup = option as FlatConfigOptionGroup;

          return (
            <div
              className="display-group-container"
              key={optionGroup.selectionPath}
            >
              <label className="display-group-label">
                {optionGroup.groupName}
              </label>
              {renderDisplayOptions(optionGroup.items)}
            </div>
          );
        }

        return (
          <OptionSelect
            key={`${option.parentModelicaPath}---${option.modelicaPath}`}
            option={option}
            updateSelectedOption={updateSelectedConfigOption}
          />
        );
      },
    );
  }

  return (
    <Modal isOpen close={close} className="config-slide-out">
      <h3>{template?.name}</h3>
      <form onSubmit={saveConfigOptions}>
        <label className="config-name-label">
          Configuration Name: {configName}
        </label>
        {/* TODO: Fix how updating configuration name on submit is not working. */}
        {/*<input
          type="text"
          id="configName"
          name="configName"
          defaultValue={configName}
          onChange={updateConfigName}
          placeholder="Name Your Configuration"
        />*/}
        {renderDisplayOptions(displayedOptions)}
        <div className="submit-container">
          <button type="submit">{itl.terms.save}</button>
        </div>
      </form>
    </Modal>
  );
};

export default SlideOut;
