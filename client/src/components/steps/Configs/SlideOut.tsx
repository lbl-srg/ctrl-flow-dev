import { FormEvent, Fragment, useState } from "react";

import itl from "../../../translations";
import { useStores } from "../../../data";
import { OptionInterface } from "../../../data/template";
import { getFormData } from "../../../utils/dom-utils";
import Modal from "../../modal/Modal";
import OptionSelect from "./OptionSelect";

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
  choices?: OptionInterface[];
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
  selectedOptions?: SelectedConfigOptions,
): FlatConfigOption[] {
  let flatConfigOptions: FlatConfigOption[] = [];
  optionsToFlatten.forEach((option) => {
    // Ignores paths that finish in .dat
    // TODO: Make sure we exclude only .dat at the end of the string thanks to regular expression
    if (option.modelicaPath.includes(`.dat`)) {
      return;
    }

    if (option.visible && option.childOptions?.length) {
      // Adds this option to the object for display
      flatConfigOptions = [
        ...flatConfigOptions,
        {
          parentModelicaPath,
          parentName,
          modelicaPath: option.modelicaPath,
          name: option.name,
          choices: option.childOptions,
        },
      ];

      // Sees if there are child options for this path for display based on the user selection or the default selection
      if (selectedOptions) {
        if (selectedOptions[option.modelicaPath]) {
          flatConfigOptions = [
            ...flatConfigOptions,
            ...selectedOptions[option.modelicaPath],
          ];
        }
      }
    } else if (option.childOptions?.length) {
      // Gets one level deeper into the data structure
      flatConfigOptions = [
        ...flatConfigOptions,
        ...flattenConfigOptions(
          option.childOptions,
          option.modelicaPath,
          option.name,
          selectedOptions,
        ),
      ];
    }
  });

  return flatConfigOptions;
}

// Takes a flat array of options and group them together according to their parent Modelica path.
export function groupConfigOptions(flatOptions: FlatConfigOption[]) {
  let groupedConfigOptions: FlatConfigOptionGroup[] = [];
  flatOptions.forEach((option) => {
    const existingGroupIndex = groupedConfigOptions.findIndex(
      (optionGroup) =>
        optionGroup.parentModelicaPath === option.parentModelicaPath,
    );
    // Creates a new key in the returned object
    if (existingGroupIndex === -1) {
      groupedConfigOptions = [
        ...groupedConfigOptions,
        {
          parentModelicaPath: option.parentModelicaPath,
          parentName: option.parentName,
          options: [option],
        },
      ];
    } else {
      // Adds the option to an existing group of options
      groupedConfigOptions[existingGroupIndex].options = [
        ...groupedConfigOptions[existingGroupIndex].options,
        option,
      ];
    }
  });

  return groupedConfigOptions;
}

const SlideOut = ({ configId, close }: ConfigSlideOutProps) => {
  const { configStore, templateStore } = useStores();
  const config = configStore.getById(configId);
  const template = templateStore.getTemplateByPath(config.templatePath);
  const options: OptionInterface[] = templateStore.getOptionsForTemplate(
    template?.modelicaPath,
  );

  function getSavedConfigOption(option: FlatConfigOption) {
    // Gets from the store the selected choice saved by the user if any for this option
    const savedSelectedOptionValue: string | undefined =
      configStore.findOptionValue(config.id, option.modelicaPath);

    // Finds the choice that matches the saved value
    if (savedSelectedOptionValue) {
      return option.choices?.find(
        (choice) => choice.modelicaPath === savedSelectedOptionValue,
      );
    }

    // If no saved selection found, returns first choice of the option if any
    return option.choices?.[0];
  }

  // Looks up the store to make sure that the UI takes into consideration the choices selected by the user previously or first choices if nothing was selected
  function getInitialSelection() {
    let initialSelection = {};
    const flatConfigOptions = flattenConfigOptions(options, "root", "");
    flatConfigOptions.forEach((option) => {
      const savedOptionSelection = getSavedConfigOption(option);
      if (savedOptionSelection) {
        const flatChildOptions = flattenConfigOptions(
          [savedOptionSelection],
          option.modelicaPath,
          option.name,
        );
        if (flatChildOptions.length > 0) {
          initialSelection = {
            ...initialSelection,
            [option.modelicaPath]: flatChildOptions,
          };
        }
      }
    });

    return initialSelection;
  }

  const [selectedOptions, setSelectedOptions] = useState<SelectedConfigOptions>(
    getInitialSelection(),
  );

  const flatConfigOptions = flattenConfigOptions(
    options,
    "root",
    "",
    selectedOptions,
  );

  // TODO: Finish implementing grouping of options
  // const groupedConfigOptions = groupConfigOptions(flatConfigOptions);

  function updateSelectedConfigOption(
    parentModelicaPath: string,
    parentName: string,
    option: OptionInterface,
  ) {
    const newOptions = flattenConfigOptions(
      [option],
      parentModelicaPath,
      parentName,
    );

    setSelectedOptions({
      ...selectedOptions,
      [parentModelicaPath]: newOptions,
    });
  }

  function saveConfigOptions(event: FormEvent) {
    event.preventDefault();
    event.stopPropagation();

    const data = getFormData(event.target as HTMLFormElement);
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
