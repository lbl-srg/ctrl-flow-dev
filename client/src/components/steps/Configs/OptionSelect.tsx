import { Fragment, ChangeEvent } from "react";
import { useStores } from "../../../data";

import { OptionInterface } from "../../../data/template";
import { FlatConfigOption } from "./SlideOut";

export interface OptionSelectProps {
  option: FlatConfigOption;
  updateSelectedOption: (
    modelicaPath: string,
    scope: string,
    choice: string | null,
  ) => void;
}

const OptionSelect = ({
  option,
  updateSelectedOption,
}: OptionSelectProps) => {

  function selectOption(event: ChangeEvent<HTMLSelectElement>) {
    updateSelectedOption(
      option.modelicaPath,
      option.scope,
      event.target.value || null,
    );
  }

  return (
    <Fragment>
      <label>
        {option.name}
      </label>
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
    </Fragment>
  );
};

export default OptionSelect;
