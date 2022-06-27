import { OptionInterface } from "../../../../data/template";
import { useState, Fragment, useEffect, ChangeEvent } from "react";
import { ConfigInterface } from "../../../../data/config";
import { useStores } from "../../../../data";
import { poj } from "../../../../utils/utils";
export interface OptionProps {
  option: OptionInterface;
  config: ConfigInterface;
}

const Option = ({ option, config }: OptionProps) => {
  const children = option.childOptions ? option.childOptions : [];
  const { configStore } = useStores();
  const selection = config.selections?.find(
    (s) => s.name === option.modelicaPath,
  );
  const defaultValue = configStore.findOptionValue(
    config.id,
    option.modelicaPath,
  );

  // default selectedOption as the first of the children
  const [selectedOption, setSelectedOption] = useState(
    children?.find(
      (c) => c.modelicaPath === selection?.value,
    ) as OptionInterface,
  );

  function optionSelected(ev: ChangeEvent<HTMLSelectElement>) {
    const childOption = children.find(
      (child) => child.modelicaPath === ev.target.value,
    );
    if (childOption) setSelectedOption(childOption);
  }

  if (option.visible) {
    return (
      <Fragment>
        <label>{option.name}</label>

        {children.length ? (
          <select
            name={option.modelicaPath}
            defaultValue={selectedOption?.modelicaPath || defaultValue}
            onChange={optionSelected}
          >
            {children.map((child) => {
              return (
                <option key={child.modelicaPath} value={child.modelicaPath}>
                  {child.name}
                </option>
              );
            })}
          </select>
        ) : (
          // TODO: this might need to be a checkbox for Boolean if no options
          <input
            type="text"
            name={option.name}
            defaultValue={option.value as string}
          />
        )}
        {selectedOption ? (
          <Option
            key={selectedOption.modelicaPath}
            config={config}
            option={selectedOption}
          />
        ) : null}
      </Fragment>
    );
  } else {
    return (
      <Fragment>
        {children.map((child, index) => (
          <Option key={child.name + index} config={config} option={child} />
        ))}
      </Fragment>
    );
  }
};

export default Option;
