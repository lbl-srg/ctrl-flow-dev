import { FormEvent, Fragment, useState } from "react";

import itl from "../../../translations";
import { useStores } from "../../../data";
import { OptionInterface } from "../../../data/template";
import { getFormData } from "../../../utils/dom-utils";
import Modal from "../../modal/Modal";
import OptionSelect from "./OptionSelect";

import { evaluateExpression, isExpression } from "../../../utils/expression-helpers";
// import { getModifierContext, applyChoiceModifiers, applyValueModifiers } from "../../../utils/modifier-helpers";
import { getModifierContext, applyValueModifiers } from "../../../utils/modifier-helpers";

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
  scopeList: string[];
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
  scopeList: string[],
  scope: string,
  setScope: boolean,
  allOptions: any,
): FlatConfigOption[] {
  let flatModifiers: any = { ...modifiers };
  let flatConfigOptions: FlatConfigOption[] = [];
  let newScopeList = [...scopeList];
  let newScope = scope;
  let changeScope = setScope;

  optionsToFlatten.forEach((option) => {
    // Ignores paths that finish in .dat
    // TODO: Make sure we exclude only .dat at the end of the string thanks to regular expression
    if (option.modelicaPath.includes(`.dat`)) {
      return;
    }

    if (changeScope) {
      newScope = option.modelicaPath;
      changeScope = false;
    }

    if (option.definition) {
      changeScope = true;
    }
      

    newScopeList = option.scopeList || newScopeList;

    // might need to set this up where it gets all modifiers of all options instead of only keeping modifiers up to the specific option
    flatModifiers = getModifierContext(option, flatModifiers, allOptions);

    flatConfigOptions = [
      ...flatConfigOptions,
      {
        parentModelicaPath,
        parentName,
        modelicaPath: option.modelicaPath,
        name: option.name,
        modifiers: flatModifiers,
        choices: option.childOptions || [],
        value: null,
        enable: option.enable,
        visible: option.visible,
        scopeList: newScopeList,
        scope: newScope,
      },
    ];

    if (option.childOptions?.length) {
      flatConfigOptions = [
        ...flatConfigOptions,
        ...flattenConfigOptions(
          option.childOptions,
          option.modelicaPath,
          option.name,
          flatModifiers,
          newScopeList,
          newScope,
          changeScope,
          allOptions,
        ),
      ];
    }

    // const { [option.modelicaPath]: selectedOption, ...remainingOptions } = selectedOptions;
    // const selectedModifiers: any = selectedOption?.modifiers || {};
    // const newModifiers: any = getModifierContext(option, modifiers, selectedModifiers);
    // const choices = applyChoiceModifiers(option, newModifiers, selectedValues);

    // if (option.visible && option.childOptions?.length) {
    //   const value = applyValueModifiers(option, newModifiers, choices?.[0]?.modelicaPath, selectedValues);

    //   // Adds this option to the object for display
    //   flatConfigOptions = [
    //     ...flatConfigOptions,
    //     {
    //       parentModelicaPath,
    //       parentName,
    //       modelicaPath: option.modelicaPath,
    //       name: option.name,
    //       modifiers: newModifiers,
    //       choices: choices,
    //       value: value,
    //       enable: option.enable,
    //       visible: option.visible,
    //     },
    //   ];

    //   // console.log('selectedOptions: ', selectedOptions);

    //   //Sees if there are child options for this path for display based on the user selection or the default selection
    //   if (Object.keys(selectedOptions)?.length !== 0) {
    //     if (selectedOption) {
    //       flatConfigOptions = [
    //         ...flatConfigOptions,
    //         ...flattenConfigOptions(
    //           [selectedOption],
    //           option.modelicaPath,
    //           option.name,
    //           newModifiers,
    //           selectedValues,
    //           remainingOptions,
    //         ),
    //       ];
    //     }
    //   }
    // } else if (option.childOptions?.length) {
    //   // Gets one level deeper into the data structure
    //   flatConfigOptions = [
    //     ...flatConfigOptions,
    //     ...flattenConfigOptions(
    //       choices,
    //       option.modelicaPath,
    //       option.name,
    //       newModifiers,
    //       selectedValues,
    //       selectedOptions
    //     ),
    //   ];
    // }
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
  const options: OptionInterface[] = templateStore.getOptionsForTemplate(
    template?.modelicaPath,
  );

  console.log('options: ', options);

  const allOptions = templateStore.getAllOptions();

  const flatConfigOptions = flattenConfigOptions(
    options,
    "root",
    "",
    {},
    [],
    "",
    true,
    allOptions,
  );

  const savedSelections = configStore.getConfigSelections(configId);

  const [selectedValues, setSelectedValues] = useState<SelectedConfigValues>(() => {
    return getInitalSelections();
  });

  const displayedConfigOptions = applyModifiers();

  // const selectedOptions = getSelectedOptions();

  // TODO: Grab config name field
  // const [configName, setConfigName] = useState()

  //TODO: move state to config page, we need to save generated flatConfigOptions and pass it to the slideOut so we can save default config values

  // const flatConfigOptions = flattenConfigOptions(
  //   options,
  //   "root",
  //   "",
  //   {},
  //   selectedValues,
  //   // selectedOptions,
  // );

  // Apply Visabilitlity

  // console.log('selectedOptions: ', selectedOptions);
  // console.log('flatConfigOptions: ', flatConfigOptions);

  // TODO: Finish implementing grouping of options
  // const groupedConfigOptions = groupConfigOptions(flatConfigOptions);

  // function getSelectedOptions() {
  //   const selectedOptions: any = {};

  //   // console.log('selectedValues: ', selectedValues);

  //   for (const modelicaPath in selectedValues) {
  //     // console.log('modelicaPath: ', modelicaPath);
  //     selectedOptions[modelicaPath] = templateStore.getOption(selectedValues[modelicaPath]);
  //   }

  //   // console.log('selectedOptions :', selectedOptions);

  //   return selectedOptions;
  // }

  function getInitalSelections(): SelectedConfigValues {
    let initialSelections = { ...savedSelections };

    flatConfigOptions.forEach((configOption) => {
      initialSelections = {
        ...initialSelections,
        [configOption.modelicaPath]: applyValueModifiers(configOption, initialSelections, allOptions),
      };
    });

    return initialSelections;
  }

  function applyModifiers() {
    setValues();
    return applyVisabilityModifiers();
  }

  function setValues() {
    flatConfigOptions.forEach((configOption) => {
      configOption.value = applyValueModifiers(configOption, selectedValues, allOptions);
    });
  }

  function applyVisabilityModifiers() {
    const displayedOptions: FlatConfigOption[] = [];

    flatConfigOptions.forEach((configOption) => {
      const modifier: any = configOption.modifiers[configOption.modelicaPath];

      if (isExpression(configOption.enable)) {
        configOption.enable = evaluateExpression(
          configOption.enable,
          selectedValues,
          configOption.scopeList,
          allOptions
        );

        // if (isExpression(configOption.enable)) {
        //   configOption.enable = false;
        // }
      }

      if (modifier?.final !== undefined) {
        configOption.visible = configOption?.visible && !modifier.final;
      }

      // TODO: Remove this, it is a temporay hack
      const hideArray = ['ASHRAE', 'Title 24'];
      hideArray.forEach((condition) => {
        if (configOption.name.includes(condition)) {
          configOption.visible = false;
        }
      });

      // configOption.visible = configOption.visible && configOption.enable;

      if (configOption.visible && configOption.choices?.length) {
        displayedOptions.push(configOption);
      }
    });

    return displayedOptions;
  }

  function updateSelectedConfigOption(
    parentModelicaPath: string,
    // parentName: string,
    // option: OptionInterface,
    choice: string | null,
  ) {
    // setSelectedValues((prevState: any) => {
    //   return {
    //     ...prevState,
    //     [parentModelicaPath]: option.modelicaPath,
    //   }
    // });
    setSelectedValues((prevState: any) => {
      return {
        ...prevState,
        [parentModelicaPath]: choice,
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
