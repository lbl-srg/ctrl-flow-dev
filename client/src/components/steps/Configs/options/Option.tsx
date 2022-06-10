import { OptionInterface } from "../../../../data/template";
import { useState, Fragment, useEffect, ChangeEvent } from "react";

const Option = ({ option }: { option: OptionInterface }) => {
  const children = option.childOptions
    ? option.childOptions.filter((child) => child.visible)
    : [];

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

  return (
    <Fragment>
      <label>{option.name}</label>

      {children.length ? (
        <select
          name={option.name}
          defaultValue={option.value as string}
          onChange={optionSelected}
        >
          {children.map((child) => {
            return (
              <option key={child.modelicaPath} value={child.value as string}>
                {child.name}
              </option>
            );
          })}
        </select>
      ) : (
        <input
          type="text"
          name={option.name}
          defaultValue={option.value as string}
        />
      )}

      {childOptions.map((child, index) => (
        <Option key={child.name + index} option={child} />
      ))}
    </Fragment>
  );
};

export default Option;
