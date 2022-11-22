import { FormEvent, Fragment, useEffect, useState } from "react";

import itl from "../../../translations";
import { useStores } from "../../../data";
import { OptionInterface } from "../../../data/template";
import { getFormData } from "../../../utils/dom-utils";
import Modal from "../../modal/Modal";
import OptionSelect from "./OptionSelect";

import {
  applyValueModifiers,
  applyVisibilityModifiers,
  Modifiers,
  getUpdatedModifiers,
  ConfigValues,
} from "../../../utils/modifier-helpers";

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
  value: any;
  scope: string;
}

export interface FlatConfigOptionChoice {
  modelicaPath: string;
  name: string;
}

export interface ConfigSlideOutProps {
  config: any;
  template: any;
  templateOptions: OptionInterface[];
  templateModifiers: Modifiers;
  selections: ConfigValues;
  allOptions: { [key: string]: OptionInterface };
  close: () => void;
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

const SlideOut = ({
  config,
  template,
  templateOptions,
  templateModifiers,
  selections,
  allOptions,
  close,
}: ConfigSlideOutProps) => {
  const { configStore, templateStore } = useStores();

  const [selectedValues, setSelectedValues] =
    useState<ConfigValues>(selections);
  // template defaults + selections
  let configModifiers: Modifiers = getUpdatedModifiers(
    selectedValues,
    templateModifiers,
    templateStore._options,
  );
  const evaluatedValues: ConfigValues = getEvaluatedValues(
    templateOptions,
    "",
    false,
  );

  configModifiers = getUpdatedModifiers(
    {
      ...evaluatedValues,
      ...selectedValues,
    },
    configModifiers,
    templateStore._options,
  );

  const displayedOptions: (FlatConfigOptionGroup | FlatConfigOption)[] =
    getDisplayOptions(templateOptions, "root", "", false);

  //
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

      const selectionPath = `${option.modelicaPath}-${currentScope}`;
      const isVisible = applyVisibilityModifiers(
        option,
        currentScope,
        selectionPath,
        selectedValues,
        configModifiers,
        template.pathModifiers,
        allOptions,
      );

      if (isVisible) {
        displayOptions = [
          ...displayOptions,
          {
            parentModelicaPath,
            modelicaPath: option.modelicaPath,
            name: option.name,
            choices: option.childOptions || [],
            value:
              selectedValues[selectionPath] || evaluatedValues[selectionPath],
            scope: currentScope,
          },
        ];

        if (selectedValues[selectionPath]) {
          const selectedOption = allOptions[
            selectedValues[selectionPath]
          ] as OptionInterface;

          displayOptions = [
            ...displayOptions,
            ...getDisplayOptions(
              [selectedOption],
              option.modelicaPath,
              currentScope,
              option.definition,
            ),
          ];
        } else if (evaluatedValues[selectionPath]) {
          const evaluatedOption = allOptions[
            evaluatedValues[selectionPath]
          ] as OptionInterface;

          displayOptions = [
            ...displayOptions,
            ...getDisplayOptions(
              [evaluatedOption],
              option.modelicaPath,
              currentScope,
              option.definition,
            ),
          ];
        }
      } else if (option.definition && option.childOptions?.length) {
        displayOptions = [
          ...displayOptions,
          {
            groupName: option.name,
            selectionPath,
            items: getDisplayOptions(
              option.childOptions,
              option.modelicaPath,
              currentScope,
              option.definition,
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
          ),
        ];
      }
    });

    return displayOptions;
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
      };
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
            configId={config.id}
            updateSelectedConfigOption={updateSelectedConfigOption}
          />
        );
      },
    );
  }

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
        {renderDisplayOptions(displayedOptions)}
        <button type="submit">{itl.terms.save}</button>
      </form>
    </Modal>
  );
};

export default SlideOut;
