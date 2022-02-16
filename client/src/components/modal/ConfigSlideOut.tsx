/** @jsxRuntime classic */
/** @jsx jsx */
import { css, jsx } from "@emotion/react/macro";
import { Fragment, ReactNode, useState } from "react";
import styled from "@emotion/styled";
import { Field, Form, Formik } from "formik";

import Button, { LinkButton } from "../Button";
import { BaseModal, ModalOpenContext } from "./BaseModal";

import {
  useStore,
  Configuration,
  System,
  Option,
  Selection,
} from "../../store/store";

interface SlideOutProps {
  template: System;
  config?: Configuration;
}

const SlideOut = ({ template, config }: SlideOutProps) => {
  const [isOpen, setOpen] = useState(false);
  const { options } = useStore((state) => ({
    options: state.templates.options,
  }));
  const systemOptions = template.options
    ? (template.options.map((optionId) =>
        options.find((o) => o.id === optionId),
      ) as Option[])
    : [];
  const configSelections = config?.selections || [];
  // pass in all selections with each option
  // if the option has a selection, apply it
  // check if option has options, if it does, render it
  // if that section is another option, render that option, check for a selection, and apply it
  // else if final, apply selection

  return (
    <ModalOpenContext.Provider value={isOpen}>
      <Fragment>
        <Button onClick={() => setOpen(true)}>Edit</Button>
        <BaseModal
          closeAction={() => setOpen(false)}
          showCloseButton={false}
          css={slideOutCss}
        >
          <h3>Configuration Name</h3>
          <input></input>
          {systemOptions.map((option) => (
            <div key={option.id}>
              <OptionDisplay
                optionID={option.id}
                options={options}
                selections={configSelections}
              />
            </div>
          ))}
        </BaseModal>
      </Fragment>
    </ModalOpenContext.Provider>
  );
};

interface OptionDisplayProps {
  optionID: number;
  options: Option[];
  selections: Selection[];
}

const OptionDisplay = ({
  optionID,
  options,
  selections,
}: OptionDisplayProps) => {
  const option = options.find((o) => o.id === optionID) as Option;
  const selection = selections.find((s) => s.selection === optionID);
  const optionList =
    (option.options?.map((oID) =>
      options.find((o) => o.id === oID),
    ) as Option[]) || ([] as Option[]);

  // TODO: will need to conditionally render the option based on 'type' (bool, value, dropdown)

  return (
    <Fragment>
      <Label htmlFor={option.name}>{option.name}</Label>
      <Field id={option.name} name={option.name}>
        {optionList.map((o) => (
          <option key={o.id} value={o.name}>
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

const slideOutCss = css`
  right: 0; // force pane to the right hand side
  top: 0; // force pane to the top
  margin: 0; // reset the margin
  height: 100vh;
  width: 28rem;
`;

export default SlideOut;
