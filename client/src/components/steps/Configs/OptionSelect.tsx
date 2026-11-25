import { Fragment, ChangeEvent } from "react";
import { useStores } from "../../../data";

import { OptionInterface } from "../../../data/template";
import { FlatConfigOption } from "./SlideOut";

export interface OptionSelectProps {
  option: FlatConfigOption;
  updateSelectedOption: (
    option: FlatConfigOption,
    choice: string | boolean | null,
  ) => void;
}

const OptionSelect = ({
  option,
  updateSelectedOption,
}: OptionSelectProps) => {

  function selectOption(event: ChangeEvent<HTMLSelectElement>) {
    if (option.selectionType === "Boolean") {
      const value =
        event.target.value === "true" || event.target.value === "false"
          ? JSON.parse(event.target.value)
          : null;
      updateSelectedOption(option, value);
    } else {
      updateSelectedOption(option, event.target.value || null);
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
          required
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
        required
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
