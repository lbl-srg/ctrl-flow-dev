import { Field } from "formik";
import { Fragment } from "react";
import styled from "@emotion/styled";

export interface SelectInputOption {
  id: number;
  name: string;
}

interface SelectInputProps {
  id: string;
  name: string;
  options: SelectInputOption[];
  defaultOption?: SelectInputOption;
}

export const SelectInput = ({
  id,
  name,
  options,
  defaultOption,
}: SelectInputProps) => {
  const defaultVal = defaultOption ? defaultOption.id : null;
  return (
    <Fragment>
      <Label htmlFor={name}>{name}</Label>
      <Field as="select" id={id} name={name} selected={defaultVal}>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </Field>
    </Fragment>
  );
};

const Label = styled.label`
  display: block;
  font-weight: bold;
`;
