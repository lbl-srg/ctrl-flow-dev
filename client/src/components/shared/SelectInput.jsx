import { Field } from "formik";
import { Fragment } from "react";

export const SelectInput = ({ id, name, label, options, defaultOption }) => {
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
