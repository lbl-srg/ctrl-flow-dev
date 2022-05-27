import { Field } from "formik";
import { Fragment } from "react";

export interface SelectInputOption {
  id: number;
  name: string;
}

interface SelectInputProps {
  id: string;
  name: string;
  label: string;
  options: SelectInputOption[];
  defaultOption?: SelectInputOption;
}

export const SelectInput = ({
  id,
  name,
  label,
  options,
  defaultOption,
}: SelectInputProps) => {
  const defaultVal = defaultOption ? defaultOption.id : null;
  return (
    <Fragment>
      <label htmlFor={name}>{label}</label>
      <Field
        as="select"
        id={id}
        name={name}
        selected={defaultVal}
        disabled={options.length === 0}
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </Field>
    </Fragment>
  );
};
