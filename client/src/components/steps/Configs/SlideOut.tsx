import { ChangeEvent, FormEvent, Fragment, useEffect, useState } from "react";

import itl from "../../../translations";
import { useStores } from "../../../data";
import { OptionInterface } from "../../../data/template";
import Modal from "../../modal/Modal";
import OptionSelect from "./OptionSelect";
import { useDebouncedCallback } from "use-debounce";

import {
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
  close,
}: ConfigSlideOutProps) => {
  const { configStore, templateStore } = useStores();
  const [selectedValues, setSelectedValues] = useState<ConfigValues>({
    ...selections,
    ...projectSelections,
  });
  const [configName, setConfigName] = useState<string>(config.name);

  // template defaults + selections
  let configModifiers: Modifiers = getUpdatedModifiers(
    selectedValues,
    templateModifiers,
    templateStore._options,
  );
  const evaluatedValues: ConfigValues = {
    ...getEvaluatedValues(templateOptions, "", false),
    ...projectEvaluatedValues,
  };

  configModifiers = getUpdatedModifiers(
    {
      ...evaluatedValues,
      ...selectedValues,
    },
    configModifiers,
    templateStore._options,
  );

  const displayedOptions: (FlatConfigOptionGroup | FlatConfigOption)[] =
    getDisplayOptions(
      templateOptions,
      "root",
      "",
      false,
      templateOptions[0].name,
    );

  function getEvaluatedValues(
    options: OptionInterface[],
    scope: string,
    changeScope: boolean,
  ): ConfigValues {
    let evaluatedValues: ConfigValues = {};
    let currentScope = scope;

    options.forEach((option) => {
      if (option.modelicaPath.includes(`.dat`)) {
        return;
      }

      // update local scope if changeScope is true
      if (changeScope) {
        const instance = option.modelicaPath.split(".").pop() || "";
        currentScope = scope ? `${scope}.${instance}` : instance;
      }

      // build selection path
      const selectionPath = `${option.modelicaPath}-${currentScope}`;

      evaluatedValues = {
        ...evaluatedValues,
        [selectionPath]: applyValueModifiers(
          option?.value,
          currentScope,
          selectionPath,
          selectedValues,
          configModifiers,
          template.pathModifiers,
          allOptions,
        ),
      };

      if (option.childOptions?.length) {
        evaluatedValues = {
          ...evaluatedValues,
          ...getEvaluatedValues(
            option.childOptions,
            currentScope,
            option.definition,
          ),
        };
      }
    });

    return evaluatedValues;
  }

  function getDisplayOptions(
    options: OptionInterface[],
    parentModelicaPath: string,
    scope: string,
    changeScope: boolean,
    groupName: string,
  ): (FlatConfigOptionGroup | FlatConfigOption)[] {
    let displayOptions: (FlatConfigOptionGroup | FlatConfigOption)[] = [];
    let currentScope = scope;

    options.forEach((option) => {
      if (option.modelicaPath.includes(`.dat`)) {
        return;
      }

      if (changeScope) {
        const instance = option.modelicaPath.split(".").pop() || "";
        currentScope = scope ? `${scope}.${instance}` : instance;
      }

      let selectionPath = `${option.modelicaPath}-${currentScope}`;
      const isVisible = applyVisibilityModifiers(
        option,
        currentScope,
        selectionPath,
        selectedValues,
        configModifiers,
        template.pathModifiers,
        allOptions,
      );

      // a modifier can redeclare a replaceable parameter, swapping the option type
      // When a swap happens, we need to make sure
      const optionMod = configModifiers[currentScope]; // could be a value change or a path change
      if (optionMod) {
        const resolvedValue = applyOptionModifier(
          // TODO: implement
          optionMod,
          configModifiers,
          allOptions,
        );
        // is this a replaceable - figure out how to do this
        const isReplaceable = option.replaceable; // TODO - how to determine if something is a replaceable
        if (isReplaceable) {
          option = allOptions[resolvedValue];
          // update selectionPath: replace left-hand-side with new option modelica path
          selectionPath = `${option.type}-${currentScope}`;
          // need to update evaluated-values with all downstream value options
        }
      }

      if (isVisible) {
        const value =
          selectedValues[selectionPath] || evaluatedValues[selectionPath];
        if (option.childOptions?.length) {
          displayOptions = [
            ...displayOptions,
            {
              parentModelicaPath,
              modelicaPath: option.modelicaPath,
              name: option.name,
              choices: option.childOptions,
              value,
              scope: currentScope,
              selectionType: "Normal",
            },
          ];
        } else if (option.type === "Boolean") {
          displayOptions = [
            ...displayOptions,
            {
              parentModelicaPath,
              modelicaPath: option.modelicaPath,
              name: option.name,
              booleanChoices: ["true", "false"],
              value: value?.toString(),
              scope: currentScope,
              selectionType: "Boolean",
            },
          ];
        }

        if (
          typeof selectedValues[selectionPath] === "string" &&
          selectedValues[selectionPath]
        ) {
          const selectedOption = allOptions[
            selectedValues[selectionPath]
          ] as OptionInterface;

          if (selectedOption) {
            displayOptions = [
              ...displayOptions,
              ...getDisplayOptions(
                [selectedOption],
                option.modelicaPath,
                currentScope,
                option.definition,
                option.name,
              ),
            ];
          }
        } else if (
          typeof evaluatedValues[selectionPath] === "string" &&
          evaluatedValues[selectionPath]
        ) {
          const evaluatedOption = allOptions[
            evaluatedValues[selectionPath]
          ] as OptionInterface;

          if (evaluatedOption) {
            displayOptions = [
              ...displayOptions,
              ...getDisplayOptions(
                [evaluatedOption],
                option.modelicaPath,
                currentScope,
                option.definition,
                option.name,
              ),
            ];
          }
        }
      } else if (option.definition && option.childOptions?.length) {
        displayOptions = [
          ...displayOptions,
          {
            groupName: groupName,
            selectionPath,
            items: getDisplayOptions(
              option.childOptions,
              option.modelicaPath,
              currentScope,
              option.definition,
              groupName,
            ),
          },
        ];
        if ("groupName" in displayOptions[displayOptions.length - 1]) {
          const optionGroup = displayOptions[
            displayOptions.length - 1
          ] as FlatConfigOptionGroup;
          if (!optionGroup.items.length) {
            displayOptions.pop();
          }
        }
      } else if (option.childOptions?.length) {
        displayOptions = [
          ...displayOptions,
          ...getDisplayOptions(
            option.childOptions,
            option.modelicaPath,
            currentScope,
            option.definition,
            option.name,
          ),
        ];
      }
    });

    return displayOptions;
  }

  const updateConfigName = useDebouncedCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setConfigName(event.target.value);
    },
    1000,
  );

  function updateSelectedConfigOption(
    parentModelicaPath: string,
    scope: string,
    choice: string | null,
  ) {
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

  function saveConfigOptions(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();

    configStore.update(config.id, { name: configName });
    configStore.setSelections(config.id, selectedValues);
    configStore.setEvaluatedValues(config.id, removeEmpty(evaluatedValues));

    close();
  }

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

  console.log("templateOptions: ", templateOptions);
  console.log("selectedValues: ", selectedValues);
  console.log("evaluatedValues: ", evaluatedValues);
  console.log("displayOptions: ", displayedOptions);

  return (
    <Modal isOpen close={close} className="config-slide-out">
      <h3>{template?.name}</h3>
      <form onSubmit={saveConfigOptions}>
        <label>Configuration name</label>
        {/* TODO: Fix how updating configuration name on submit is not working. */}
        <input
          type="text"
          id="configName"
          name="configName"
          defaultValue={configName}
          onChange={updateConfigName}
          placeholder="Name Your Configuration"
        />
        {renderDisplayOptions(displayedOptions)}
        <button type="submit">{itl.terms.save}</button>
      </form>
    </Modal>
  );
};

export default SlideOut;
