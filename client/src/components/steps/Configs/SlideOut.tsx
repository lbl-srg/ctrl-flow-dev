import { ChangeEvent, FormEvent, Fragment, useEffect, useState } from "react";

import itl from "../../../translations";
import { useStores } from "../../../data";
import { ConfigInterface } from "../../../data/config";
import { OptionInterface, TemplateInterface } from "../../../data/template";
import Modal from "../../modal/Modal";
import OptionSelect from "./OptionSelect";

import {
  applyOptionModifier,
  applyVisibilityModifiers,
  Modifiers,
  ConfigValues,
} from "../../../utils/modifier-helpers";
import { getContext } from "../../../utils/interpreter";
import { removeEmpty, extractSimpleDisplayList } from "../../../utils/utils";

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

export const getOptionTree = (
  options: OptionInterface[],
  parentModelicaPath: string,
  scope: string,
  changeScope: boolean,
  groupName: string,
  evalProps: {
    template: TemplateInterface;
    selectedValues: ConfigValues;
    modifiers: Modifiers;
    allOptions: { [key: string]: OptionInterface };
    evaluatedValues: ConfigValues;
  },
): (FlatConfigOptionGroup | FlatConfigOption)[] => {
  let displayOptions: (FlatConfigOptionGroup | FlatConfigOption)[] = [];
  let currentScope = scope;

  const { template, selectedValues, modifiers, allOptions, evaluatedValues } =
    evalProps;

  options.forEach((option) => {
    if (option.modelicaPath.includes(`.dat`)) {
      return;
    }

    if (changeScope) {
      const instance = option.modelicaPath.split(".").pop() || "";
      currentScope = scope ? `${scope}.${instance}` : instance;
    }

    if (option.replaceable) {
      option = applyOptionModifier(
        option,
        currentScope,
        selectedValues,
        modifiers,
        template.pathModifiers,
        allOptions,
      );
    }

    const selectionPath = `${option.modelicaPath}-${currentScope}`;
    const isVisible = applyVisibilityModifiers(
      option,
      currentScope,
      selectedValues,
      modifiers,
      template.pathModifiers,
      allOptions,
    );

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
            ...getOptionTree(
              [selectedOption],
              option.modelicaPath,
              currentScope,
              option.definition,
              option.name,
              evalProps,
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
            ...getOptionTree(
              [evaluatedOption],
              option.modelicaPath,
              currentScope,
              option.definition,
              option.name,
              evalProps,
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
          items: getOptionTree(
            option.childOptions,
            option.modelicaPath,
            currentScope,
            option.definition,
            groupName,
            evalProps,
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
        ...getOptionTree(
          option.childOptions,
          option.modelicaPath,
          currentScope,
          option.definition,
          option.name,
          evalProps,
        ),
      ];
    }
  });

  return displayOptions;
};

export interface ConfigSlideOutProps {
  config: ConfigInterface;
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

  const configName = config.name as string;

  const { configModifiers, evaluatedValues } = getContext(template, config.id);

  const displayedOptions: (FlatConfigOptionGroup | FlatConfigOption)[] =
    getOptionTree(templateOptions, "root", "", false, templateOptions[0].name, {
      template,
      selectedValues,
      modifiers: configModifiers,
      allOptions,
      evaluatedValues,
    });

  extractSimpleDisplayList(displayedOptions, true);

  useEffect(() => {
    stopLoading();
  }, []);

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

  function saveConfigOptions(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();

    // configStore.update(config.id, { name: configName });
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
