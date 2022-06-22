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

  const defaultValue = configStore.findOptionValue(
    config.id,
    option.modelicaPath,
  );

  // default selectedOption as the first of the children
  const [selectedOption, setSelectedOption] = useState(
    children[0] as OptionInterface,
  );

  const [childOptions, setChildOptions] = useState([] as OptionInterface[]);

  useEffect(() => {
    if (selectedOption && selectedOption.childOptions) {
      setChildOptions(
        selectedOption.childOptions.filter((child) => child.visible),
      );
    } else setChildOptions([]);
  }, [selectedOption]);

  function optionSelected(ev: ChangeEvent<HTMLSelectElement>) {
    const childOption = children.find(
      (child) => child.value === ev.target.value,
    );
    if (childOption) setSelectedOption(childOption);
  }

  // TODO: switch recursive 'option' rendering to use 'childOptions'
  // once 'sets' are working as expected

  if (option.visible) {
    return (
      <Fragment>
        <label>{option.name}</label>

        {children.length ? (
          <select
            name={option.modelicaPath}
            defaultValue={defaultValue}
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
        {childOptions.map((child, index) => (
          <Option key={child.name + index} config={config} option={child} />
        ))}
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
