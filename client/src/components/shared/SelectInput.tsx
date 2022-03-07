import { Field } from "formik";
import { Fragment } from "react";
import styled from "@emotion/styled";

interface SelectInputProps {
  id: string;
  name: string;
  options: { id: number; name: string }[];
}

export const SelectInput = ({ id, name, options }: SelectInputProps) => {
  return (
    <Fragment>
      <Label htmlFor={name}>{name}</Label>
      <Field as="select" id={id} name={name}>
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
