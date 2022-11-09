import { FormEvent, Fragment, useState } from "react";

import itl from "../../../translations";
import { useStores } from "../../../data";
import { OptionInterface } from "../../../data/template";
import { getFormData } from "../../../utils/dom-utils";
import Modal from "../../modal/Modal";
import OptionSelect from "./OptionSelect";

import { evaluateExpression, isExpression } from "../../../utils/expression-helpers";
// import { getModifierContext, applyChoiceModifiers, applyValueModifiers } from "../../../utils/modifier-helpers";
import { getModifierContext, applyValueModifiers, buildModifiers } from "../../../utils/modifier-helpers";

import "../../../styles/components/config-slide-out.scss";

export interface FlatConfigOptionGroup {
  parentModelicaPath: string;
  parentName: string;
  options: FlatConfigOption[];
}

export interface FlatConfig {
  flatConfigOptions: FlatConfigOption[];
  flatConfigModifiers: any;
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
  [key: string]: string[];
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
  modifiers: any,
  // selectedValues: SelectedConfigValues,
  // selectedOptions: any = {},
  treeList: string[],
  scope: string,
  changeScope: boolean,
  allOptions: any,
): FlatConfig {
  let flatConfigOptions: FlatConfigOption[] = [];
  let flatConfigModifiers: any = { ...modifiers };
  let newTreeList = [...treeList];
  let currentScope = scope;

  optionsToFlatten.forEach((option) => {
    // Ignores paths that finish in .dat
    // TODO: Make sure we exclude only .dat at the end of the string thanks to regular expression
    if (option.modelicaPath.includes(`.dat`)) {
      return;
    }

    newTreeList = option.treeList || newTreeList;

    // TODO: Amit's Tasks
    // resolving modifers, needs Daren's backend changes

    if (changeScope) {
      const instance = option.modelicaPath.split('.').pop() || "";
      currentScope = scope ? `${scope}.${instance}` : instance;
    }

    if (option.modifiers) {
      flatConfigModifiers = buildModifiers(option.modifiers, currentScope, flatConfigModifiers);
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
      const {
        flatConfigOptions: flatChildOptions,
        flatConfigModifiers: flatChildModifiers
      } = flattenConfigOptions(
        option.childOptions,
        option.modelicaPath,
        option.name,
        flatConfigModifiers,
        newTreeList,
        currentScope,
        option.definition,
        allOptions,
      );

      flatConfigModifiers = {
        ...flatConfigModifiers,
        ...flatChildModifiers,
      };

      flatConfigOptions = [
        ...flatConfigOptions,
        ...flatChildOptions,
      ];
    }
  });

  return { flatConfigOptions, flatConfigModifiers };
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
  const options: OptionInterface[] = templateStore.getOptionsForTemplate(
    template?.modelicaPath,
  );

  console.log('options: ', options);

  const allOptions = templateStore.getAllOptions();

  const { flatConfigOptions, flatConfigModifiers } = flattenConfigOptions(
    options,
    "root",
    "",
    {},
    [],
    "",
    false,
    allOptions,
  );

  console.log('flatConfigModifiers: ', flatConfigModifiers);
  console.log('flatConfigOptions: ', flatConfigOptions);

  const [selectedValues, setSelectedValues] = useState<SelectedConfigValues>(() => {
    return configStore.getConfigSelections(configId);
  });

  console.log('selectedValues: ', selectedValues);

  // adjust modifiers based on userSelections
  // updateModifiers();

  const evaluatedValues = getEvaluatedValues();

  console.log('evaluatedValues: ', evaluatedValues);

  const displayedConfigOptions = applyModifiers();

  // TODO: Grab config name field
  // const [configName, setConfigName] = useState()

  //TODO: move state to config page, we need to save generated flatConfigOptions and pass it to the slideOut so we can save default config values

  // Do we need to keep track of default selections to re-evaluate expressions and how many times do we do that?
  // Keep track of default values and evaluations as a cache, when a selection is made we need to reset the cache and then set value with selections taking priority
  // We also probably need to re-evaluate expressions before we save maybe?

  // function updateModifiers() {
  //   const selectedOptions = Object.keys(selectedValues);

  //   selectedOptions.forEach((selectionPath) => {
  //     const [modelicaPath, instancePath] = selectionPath.split('-');
  //     const instance = instancePath.split('.').pop();

  //     allOptions.find((option: any) => option.modelicaPath === selection)

  //     flatConfigModifiers[instancePath] = 
  //   })
  // }

  function getEvaluatedValues(): SelectedConfigValues {
    let evaluatedValues = {};

    // if we store all default selections as initial selections, we need to re-evaluate expressions in order to see if any of those expressions changed
    flatConfigOptions.forEach((configOption) => {
      const instance = configOption.modelicaPath.split('.').pop() || "";
      const instancePath = configOption.scope ? `${configOption.scope}.${instance}` : `${instance}`;
      const selectionPath = `${configOption.modelicaPath}-${instancePath}`;

      evaluatedValues = {
        ...evaluatedValues,
        [selectionPath]: applyValueModifiers(configOption, configOption.scope, selectionPath, selectedValues, flatConfigModifiers, allOptions),
      };
    });

    return evaluatedValues;
  }

  function applyModifiers() {
    setValues();
    return applyVisabilityModifiers();
  }

  function setValues() {
    flatConfigOptions.forEach((configOption) => {
      const instance = configOption.modelicaPath.split('.').pop() || "";
      const selectionPath = configOption.scope ?
        `${configOption.modelicaPath}-${configOption.scope}.${instance}` :
        `${configOption.modelicaPath}-${instance}`;
      // configOption.value = applyValueModifiers(configOption, selectedValues, allOptions);
      configOption.value = selectedValues[selectionPath] || evaluatedValues[selectionPath];
    });
  }

  function applyVisabilityModifiers() {
    const displayedOptions: FlatConfigOption[] = [];

    flatConfigOptions.forEach((configOption) => {
      // apply modifiers final when backend changes have been made
      const instance = configOption.modelicaPath.split('.').pop() || "";
      const instancePath = configOption.scope ? `${configOption.scope}.${instance}` : instance;
      const selectionPath = `${configOption.modelicaPath}-${instancePath}`;
      // const modifier: any = flatConfigModifiers[instancePath];
      const modifier: any = flatConfigModifiers[configOption.scope];



      // option: Buildings.Templates.Components.Interfaces.PartialFan.typ
      // scope of option: fanSupBlo.typ

      // instancePath: scope + instance = fanSupBlo.typ.typ
      // if (instance === 'typ') {
      //   console.log('scope: ', configOption.scope);
      // }

      // if (instancePath === 'fanSupBlo.typ') {
      //   console.log('modifier: ', modifier);
      // }

      if (isExpression(configOption.enable)) {
        configOption.enable = evaluateExpression(
          configOption.enable,
          configOption.scope,
          selectionPath,
          selectedValues,
          flatConfigModifiers,
          configOption.treeList,
          allOptions
        );

        //Uncomment this statement to hide options that have enables that do not resolve.
        if (isExpression(configOption.enable)) {
          configOption.enable = false;
        }
      }

      // apply modifiers final when backend changes have been made
      if (modifier?.final !== undefined) {
        console.log('final modifier');
        configOption.visible = configOption?.visible && !modifier.final;
      }

      // TODO: Remove this, it is a temporay hack
      const hideArray = ['ASHRAE', 'Title 24'];
      hideArray.forEach((condition) => {
        if (configOption.name.includes(condition)) {
          configOption.visible = false;
        }
      });

      //Uncomment this statement to hide options that are disabled or are not visible.
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
      const instance = parentModelicaPath.split('.').pop() || "";
      const selectionPath = scope ?
        `${parentModelicaPath}-${scope}.${instance}` :
        `${parentModelicaPath}-${instance}`;

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

  console.log('displayedConfigOptions: ', displayedConfigOptions);

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
