import { FormEvent, Fragment, useState } from "react";

import itl from "../../../translations";
import { useStores } from "../../../data";
import { OptionInterface } from "../../../data/template";
import { getFormData } from "../../../utils/dom-utils";
import Modal from "../../modal/Modal";
import OptionSelect from "./OptionSelect";

import {
  evaluateExpression,
  isExpression
} from "../../../utils/expression-helpers";
import {
  applyValueModifiers,
  buildModifiers,
  Modifiers,
  updateModifiers
} from "../../../utils/modifier-helpers";

import "../../../styles/components/config-slide-out.scss";

export interface FlatConfigOptionGroup {
  parentModelicaPath: string;
  parentName: string;
  options: FlatConfigOption[];
}

export interface FlatConfigOption {
  parentModelicaPath: string;
  parentName: string;
  modelicaPath: string;
  name: string;
  modifiers: any;
  choices?: OptionInterface[];
  value: any;
  enable: any;
  visible: any;
  treeList: string[];
  scope: string;
}

export interface FlatConfigOptionChoice {
  modelicaPath: string;
  name: string;
}

export interface SelectedConfigValues {
  [key: string]: string;
}

// export interface SelectedConfigOptions {
//   [key: string]: FlatConfigOptions[];
// }

export interface ConfigSlideOutProps {
  configId: string;
  close: () => void;
}

// Provides a flat array of options for display. This approach avoids processing the data structure in the return statement of components and keeps the logic related to the data separate from the logic that drives how components work.
export function flattenConfigOptions(
  optionsToFlatten: OptionInterface[],
  parentModelicaPath: string,
  parentName: string,
  treeList: string[],
  scope: string,
  changeScope: boolean,
): FlatConfigOption[] {
  let flatConfigOptions: FlatConfigOption[] = [];
  let newTreeList = [...treeList];
  let currentScope = scope;

  optionsToFlatten.forEach((option) => {
    // Ignores paths that finish in .dat
    // TODO: Make sure we exclude only .dat at the end of the string thanks to regular expression
    if (option.modelicaPath.includes(`.dat`)) {
      return;
    }

    newTreeList = option.treeList || newTreeList;

    const instance = option.modelicaPath.split('.').pop() || "";

    if (changeScope) {
      currentScope = scope ? `${scope}.${instance}` : instance;
    }

    flatConfigOptions = [
      ...flatConfigOptions,
      {
        parentModelicaPath,
        parentName,
        modelicaPath: option.modelicaPath,
        name: option.name,
        modifiers: option.modifiers,
        choices: option.childOptions || [],
        value: option?.value,
        enable: option.enable,
        visible: option.visible,
        treeList: newTreeList,
        scope: currentScope,
      },
    ];

    if (option.childOptions?.length) {
      flatConfigOptions = [
        ...flatConfigOptions,
        ...flattenConfigOptions(
          option.childOptions,
          option.modelicaPath,
          option.name,
          newTreeList,
          currentScope,
          option.definition,
        ),
      ];
    }
  });

  return flatConfigOptions;
}

// Takes a flat array of options and group them together according to their parent Modelica path.
// export function groupConfigOptions(flatOptions: FlatConfigOption[]) {
//   let groupedConfigOptions: FlatConfigOptionGroup[] = [];
//   flatOptions.forEach((option) => {
//     const existingGroupIndex = groupedConfigOptions.findIndex(
//       (optionGroup) =>
//         optionGroup.parentModelicaPath === option.parentModelicaPath,
//     );
//     // Creates a new key in the returned object
//     if (existingGroupIndex === -1) {
//       groupedConfigOptions = [
//         ...groupedConfigOptions,
//         {
//           parentModelicaPath: option.parentModelicaPath,
//           parentName: option.parentName,
//           options: [option],
//         },
//       ];
//     } else {
//       // Adds the option to an existing group of options
//       groupedConfigOptions[existingGroupIndex].options = [
//         ...groupedConfigOptions[existingGroupIndex].options,
//         option,
//       ];
//     }
//   });

//   return groupedConfigOptions;
// }

const SlideOut = ({ configId, close }: ConfigSlideOutProps) => {
  const { configStore, templateStore } = useStores();
  const config = configStore.getById(configId);
  const template = templateStore.getTemplateByPath(config.templatePath);
  const allOptions: OptionInterface[] = templateStore.getAllOptions();
  const options: OptionInterface[] = templateStore.getOptionsForTemplate(
    template?.modelicaPath,
  );
  const templateModifiers: Modifiers = templateStore.getModifiersForTemplate(
    template?.modelicaPath,
  );
  const [selectedValues, setSelectedValues] = useState<SelectedConfigValues>(() => {
    return configStore.getConfigSelections(configId);
  });
  const flatConfigOptions = flattenConfigOptions(
    options,
    "root",
    "",
    [],
    "",
    false,
  );
  const evaluatedValues: SelectedConfigValues = getEvaluatedValues();
  const displayedConfigOptions = applyModifiers();

  console.log('options: ', options);
  console.log('templateModifiers: ', templateModifiers);
  console.log('selectedValues: ', selectedValues);
  console.log('evaluatedValues: ', evaluatedValues);
  console.log('displayedConfigOptions: ', displayedConfigOptions);

  // TODO: Grab config name field
  // const [configName, setConfigName] = useState()

  //TODO: MAYBE? move state to config page, we need to save generated flatConfigOptions and pass it to the slideOut so we can save default config values

  function getEvaluatedValues(): SelectedConfigValues {
    let evaluatedValues: SelectedConfigValues = {};

    // if we store all default selections as initial selections, we need to re-evaluate expressions in order to see if any of those expressions changed
    flatConfigOptions.forEach((configOption) => {
      const selectionPath = `${configOption.modelicaPath}-${configOption.scope}`;

      evaluatedValues = {
        ...evaluatedValues,
        [selectionPath]: applyValueModifiers(
          configOption,
          configOption.scope,
          selectionPath,
          selectedValues,
          templateModifiers,
          allOptions
        ),
      };
    });

    return evaluatedValues;
  }

  function applyModifiers() {
    const mergedValues: SelectedConfigValues = { ...evaluatedValues, ...selectedValues };
    getUpdatedModifiers(mergedValues);
    setValues(mergedValues);
    return applyVisabilityModifiers();
  }

  function getUpdatedModifiers(mergedValues: SelectedConfigValues) {
    const mergedOptionKeys: string[] = Object.keys(mergedValues);

    mergedOptionKeys.forEach((key) => {
      if (mergedValues[key] !== null) {
        const [modelicaPath, instancePath] = key.split('-');
        const option = allOptions.find(
          (o) => o.modelicaPath === modelicaPath,
        ) as OptionInterface;

        updateModifiers(option, instancePath, templateModifiers, allOptions);
      }
    });
  }

  function setValues(mergedValues: SelectedConfigValues) {
    flatConfigOptions.forEach((configOption) => {
      const selectionPath = `${configOption.modelicaPath}-${configOption.scope}`;
      configOption.value = mergedValues[selectionPath];
    });
  }

  function applyVisabilityModifiers() {
    const displayedOptions: FlatConfigOption[] = [];

    flatConfigOptions.forEach((configOption) => {
      // apply modifiers final when backend changes have been made
      const selectionPath = `${configOption.modelicaPath}-${configOption.scope}`;
      const modifier: any = templateModifiers[configOption.scope];

      if (isExpression(configOption.enable)) {
        configOption.enable = evaluateExpression(
          configOption.enable,
          configOption.scope,
          selectionPath,
          selectedValues,
          templateModifiers,
          allOptions
        );

        if (isExpression(configOption.enable)) {
          configOption.enable = false;
        }
      }

      if (modifier?.final !== undefined) {
        configOption.visible = configOption?.visible && !modifier.final;
      }

      configOption.visible = configOption.visible && configOption.enable;

      if (configOption.visible && configOption.choices?.length) {
        displayedOptions.push(configOption);
      }
    });

    return displayedOptions;
  }

  function updateSelectedConfigOption(
    parentModelicaPath: string,
    scope: string,
    choice: string | null,
  ) {
    setSelectedValues((prevState: any) => {
      const selectionPath = `${parentModelicaPath}-${scope}`;

      if (!choice) {
        delete prevState[selectionPath];
        return prevState;
      }

      return {
        ...prevState,
        [selectionPath]: choice,
      }
    });
  }

  function saveConfigOptions(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();

    const data = selectedValues;
    configStore.setSelections(
      config.id,
      Object.entries(data).map(([name, value]) => ({ name, value })),
    );

    close();
  }

  let overallIndex = 0;
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
          defaultValue={config.name}
          placeholder="Name Your Configuration"
        />
        {/* TODO: Figure out how we want grouping logic to work. The way the logic is implemented right now, child options from selections are not necessarily displayed right before the parent they belong to because there might be other options in the group the parent belongs to that are displayed first. */}
        {/*groupedConfigOptions.map((optionGroup) => (
          <div key={optionGroup.parentModelicaPath}>
            <label>{optionGroup.parentName}</label>
            {optionGroup.options.map(
              (option: FlatConfigOption, optionIndex) => {
                overallIndex++;
                return (
                  <OptionSelect
                    key={`${option.parentModelicaPath}---${
                      option.modelicaPath
                    }---${optionIndex + 1}`}
                    index={overallIndex}
                    option={option}
                    configId={config.id}
                    updateSelectedConfigOptions={updateSelectedConfigOptions}
                  />
                );
              },
            )}
          </div>
            ))*/}
        {displayedConfigOptions.map((option: FlatConfigOption, optionIndex) => {
          overallIndex++;
          return (
            <OptionSelect
              key={`${option.parentModelicaPath}---${option.modelicaPath}---${
                optionIndex + 1
              }`}
              index={overallIndex}
              option={option}
              configId={config.id}
              updateSelectedConfigOption={updateSelectedConfigOption}
            />
          );
        })}
        <button type="submit">{itl.terms.save}</button>
      </form>
    </Modal>
  );
};

export default SlideOut;
