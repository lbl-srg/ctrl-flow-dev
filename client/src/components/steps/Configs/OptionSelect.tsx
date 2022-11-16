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
    updateSelectedConfigOption(
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
