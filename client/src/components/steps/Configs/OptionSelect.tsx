import { Fragment, ChangeEvent } from "react";
import { useStores } from "../../../data";

import { OptionInterface } from "../../../data/template";
import { FlatConfigOption } from "./SlideOut";

export interface OptionSelectProps {
  option: FlatConfigOption;
  configId: string;
  updateSelectedConfigOption: (
    modelicaPath: string,
    // name: string,
    // selectedOption: OptionInterface,
    scope: string,
    choice: string | null,
  ) => void;
}

const OptionSelect = ({
  option,
  configId,
  updateSelectedConfigOption,
}: OptionSelectProps) => {

  function selectOption(event: ChangeEvent<HTMLSelectElement>) {
    if (option.selectionType === "Boolean") {
      const value =
        event.target.value === "true" || event.target.value === "false"
          ? JSON.parse(event.target.value)
          : null;
      updateSelectedConfigOption(
        option.modelicaPath,
        option.scope,
        value,
      );
    } else {
      updateSelectedConfigOption(
        option.modelicaPath,
        option.scope,
        event.target.value || null,
      );
    }
  }

  function renderSelect() {
    const isBooleanSelection = option.selectionType === "Boolean";

    if (isBooleanSelection) {
      return (
        <select
          name={`${option.modelicaPath}-${option.scope}`}
          defaultValue={option.value || ''}
          onChange={selectOption}
        >
          <option value=''></option>
          {option.booleanChoices?.map((choice) => (
            <option key={`${option.modelicaPath}-${choice}`} value={choice}>
              {choice}
            </option>
          ))}
        </select>
      );
    }

    return (
      <select
        name={`${option.modelicaPath}-${option.scope}`}
        defaultValue={option.value || ''}
        onChange={selectOption}
      >
        <option value=''></option>
        {option.choices?.map((choice) => (
          <option key={choice.modelicaPath} value={choice.modelicaPath}>
            {choice.name}
          </option>
        ))}
      </select>
    );
  }

  return (
    <Fragment>
      <label>
        {option.name}
      </label>
      {renderSelect()}
    </Fragment>
  );
};

export default OptionSelect;
