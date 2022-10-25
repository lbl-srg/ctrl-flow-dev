import { FormEvent, Fragment, useState } from "react";

import itl from "../../../translations";
import { useStores } from "../../../data";
import { OptionInterface } from "../../../data/template";
import { getFormData } from "../../../utils/dom-utils";
import Modal from "../../modal/Modal";
import OptionSelect from "./OptionSelect";

import { evaluateExpression } from "../../../utils/expression-helpers";
import { getModifierContext, applyChoiceModifiers, applyValueModifiers } from "../../../utils/modifier-helpers";

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
}

export interface FlatConfigOptionChoice {
  modelicaPath: string;
  name: string;
}

export interface SelectedConfigOptions {
  [key: string]: FlatConfigOption[];
}

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
  selectedOptions?: SelectedConfigOptions,
): FlatConfigOption[] {
  let flatConfigOptions: FlatConfigOption[] = [];

  // console.log('selectedOptions: ', selectedOptions);

  optionsToFlatten.forEach((option) => {
    // Ignores paths that finish in .dat
    // TODO: Make sure we exclude only .dat at the end of the string thanks to regular expression
    if (option.modelicaPath.includes(`.dat`)) {
      return;
    }

    // console.log('selectedOptions: ', selectedOptions);

    // if (typeof option?.value === 'object') {
    //   console.log('======================================================');
    //   console.log('STARTING EXPRESSION: ', option.value);
    //   console.log('FINAL VALUE EVALUATED: ', evaluateExpression(option.value));
    //   console.log('======================================================');
    // }

    const newModifiers: any = getModifierContext(option, modifiers, selectedOptions);

    if (option.visible && option.childOptions?.length) {
      // Adds this option to the object for display
      flatConfigOptions = [
        ...flatConfigOptions,
        {
          parentModelicaPath,
          parentName,
          modelicaPath: option.modelicaPath,
          name: option.name,
          modifiers: newModifiers,
          choices: applyChoiceModifiers(option, newModifiers),
          value: applyValueModifiers(option, newModifiers)
        },
      ];

      // console.log('visible childOptions (flatConfigOptions): ', flatConfigOptions);
      // console.log('selectedOptions: ', selectedOptions);
    } else if (option.childOptions?.length) {
      // Gets one level deeper into the data structure
      flatConfigOptions = [
        ...flatConfigOptions,
        ...flattenConfigOptions(
          applyChoiceModifiers(option, newModifiers),
          option.modelicaPath,
          option.name,
          newModifiers,
          selectedOptions,
        ),
      ];
      // console.log('flatConfigOptions notVisable has children: ', flatConfigOptions);
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
  const options: OptionInterface[] = templateStore.getOptionsForTemplate(
    template?.modelicaPath,
  );

  const [selectedOptions, setSelectedOptions] = useState(
    configStore.getConfigSelections(configId),
  );

  // const [configName, setConfigName] = useState()

  // console.log('selections: ', selectedOptions);

  //TODO: move state to config page, we need to save generated flatConfigOptions and pass it to the slideOut so we can save default config values

  const flatConfigOptions = flattenConfigOptions(
    options,
    "root",
    "",
    {},
    selectedOptions,
  );

  console.log('selectedOptions: ', selectedOptions);
  console.log('flatConfigOptions: ', flatConfigOptions);

  // TODO: Finish implementing grouping of options
  // const groupedConfigOptions = groupConfigOptions(flatConfigOptions);

  function updateSelectedConfigOption(
    parentModelicaPath: string,
    parentName: string,
    option: OptionInterface,
  ) {
    const newSelectedOptions = {
      ...selectedOptions,
      [parentModelicaPath]: option.modelicaPath,
    };

    setSelectedOptions(newSelectedOptions);
  }

  function saveConfigOptions(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();

    const data = selectedOptions;
    configStore.setSelections(
      config.id,
      Object.entries(data).map(([name, value]) => ({ name, value })),
    );

    close();
  }

  // console.log('FlatConfigOptions: ', flatConfigOptions);

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
        {flatConfigOptions.map((option: FlatConfigOption, optionIndex) => {
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
