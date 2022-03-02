import { Field } from "formik";
import { Fragment } from "react";
import styled from "@emotion/styled";


interface SelectInputProps {
    id: string
    name: string;
    selections: {id: number, name: string}[];
}

export const SelectInput = ({ id, name, selections }: SelectInputProps) => {
    return (
        <Fragment>
            <Label htmlFor={name}>{name}</Label>
            <Field
                as="select"
                id={id}
                name={name}>
                {selections.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </Field>
        </Fragment>  
    )
};

const Label = styled.label`
  display: block;
  font-weight: bold;
`;