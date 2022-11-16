import { FormEvent, Fragment, useEffect, useState } from "react";

import itl from "../../../translations";
import { useStores } from "../../../data";
import { OptionInterface } from "../../../data/template";
import { getFormData } from "../../../utils/dom-utils";
import Modal from "../../modal/Modal";
import OptionSelect from "./OptionSelect";

import {
  Expression,
  evaluateExpression,
  isExpression
} from "../../../utils/expression-helpers";
import {
  applyValueModifiers,
  applyVisibilityModifiers,
  buildModifiers,
  Modifiers,
} from "../../../utils/modifier-helpers";

import "../../../styles/components/config-slide-out.scss";

export interface FlatConfigOptionGroup {
  parentModelicaPath: string;
  parentName: string;
  options: FlatConfigOption[];
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

export interface ConfigValues {
  [key: string]: string;
}

export interface ConfigSlideOutProps {
  config: any;
  template: any;
  templateOptions: OptionInterface[];
  templateModifiers: Modifiers;
  selections: ConfigValues;
  allOptions: OptionInterface[];
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
  close
}: ConfigSlideOutProps) => {
  const { configStore } = useStores();
  // const [configModifiers, setConfigModifiers] = useState<Modifiers>(templateModifiers);
  // const [selectedValues, setSelectedValues] = useState<ConfigValues>(selections);
  // const [evaluatedValues, setEvaluatedValues] = useState<ConfigValues>({});
  // const [displayedOptions, setDisplayedOptions] = useState<FlatConfigOption[]>([]);

  // useEffect(() => {
  //   const updatedModifiers: Modifiers = getUpdatedModifiers(selectedValues);
  //   setConfigModifiers(updatedModifiers);

  //   const updatedValues: ConfigValues = getEvaluatedValues(
  //     templateOptions,
  //     "",
  //     false,
  //   );
  //   setEvaluatedValues(updatedValues);
  // }, [selectedValues]);

  // useEffect(() => {
  //   const updatedModifiers: Modifiers = getUpdatedModifiers({
  //     ...evaluatedValues,
  //     ...selectedValues,
  //   });
  //   setConfigModifiers(updatedModifiers);

  //   const updatedDisplayOptions: FlatConfigOption[] = getDisplayOptions(
  //     templateOptions,
  //     "root",
  //     "",
  //     false,
  //   );
  //   setDisplayedOptions(updatedDisplayOptions);
  // }, [evaluatedValues]);

  const [selectedValues, setSelectedValues] = useState<ConfigValues>(selections);
  let configModifiers: Modifiers = getUpdatedModifiers(selectedValues);
  const evaluatedValues: ConfigValues = getEvaluatedValues(
    templateOptions,
    "",
    false,
  );

  configModifiers = getUpdatedModifiers({
    ...evaluatedValues,
    ...selectedValues,
  });

  const displayedOptions: FlatConfigOption[] = getDisplayOptions(
    templateOptions,
    "root",
    "",
    false,
  );

  function getUpdatedModifiers(values: ConfigValues) {
    const optionKeys: string[] = Object.keys(values);
    // let updatedModifiers: Modifiers = { ...configModifiers };
    let updatedModifiers: Modifiers = { ...templateModifiers };

    optionKeys.forEach((key) => {
      if (values[key] !== null) {
        const [modelicaPath, instancePath] = key.split('-');
        const option = allOptions.find(
          (o) => o.modelicaPath === modelicaPath,
        ) as OptionInterface;

        updatedModifiers = {
          ...updatedModifiers,
          ...buildModifiers(
            option,
            instancePath,
            updatedModifiers,
            allOptions,
          )
        };
      }
    });

    return updatedModifiers;
  }

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

      if (changeScope) {
        const instance = option.modelicaPath.split('.').pop() || "";
        currentScope = scope ? `${scope}.${instance}` : instance;
      }

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
  ): FlatConfigOption[] {
    let displayOptions: FlatConfigOption[] = [];
    let currentScope = scope;

    options.forEach((option) => {
      if (option.modelicaPath.includes(`.dat`)) {
        return;
      }

      if (changeScope) {
        const instance = option.modelicaPath.split('.').pop() || "";
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
        allOptions
      );

      if (isVisible) {
        displayOptions = [
          ...displayOptions,
          {
            parentModelicaPath,
            modelicaPath: option.modelicaPath,
            name: option.name,
            choices: option.childOptions || [],
            value: selectedValues[selectionPath] || evaluatedValues[selectionPath],
            scope: currentScope,
          },
        ];

        if (selectedValues[selectionPath]) {
          const selectedOption = allOptions.find(
            (o) => o.modelicaPath === selectedValues[selectionPath],
          ) as OptionInterface;

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
          const evaluatedOption = allOptions.find(
            (o) => o.modelicaPath === evaluatedValues[selectionPath],
          ) as OptionInterface;

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

  function renderDisplayOptions() {
    return displayedOptions.map((option: FlatConfigOption, optionIndex) => {
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
    });
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
        {renderDisplayOptions()}
        <button type="submit">{itl.terms.save}</button>
      </form>
    </Modal>
  );
};

export default SlideOut;
