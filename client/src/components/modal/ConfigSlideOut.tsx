/** @jsxRuntime classic */
/** @jsx jsx */
import { css, jsx } from "@emotion/react/macro";
import { Fragment, useState } from "react";
import styled from "@emotion/styled";
import { Field, Form, Formik } from "formik";

import Button, { LinkButton } from "../Button";
import { BaseModal, ModalOpenContext } from "./BaseModal";

import {
  useStore,
  ConfigSelections,
  Configuration,
  System,
  Option,
  Selection,
} from "../../store/store";

interface SlideOutProps {
  template: System;
  config: Configuration;
}
const CONFIG_NAME_KEY = "configName"

const SlideOut = ({ template, config }: SlideOutProps) => {
  const [isOpen, setOpen] = useState(false);
  const { options, updateConfig } = useStore((state) => ({
    options: state.templates.options,
    updateConfig: state.updateConfig
  }));

  const systemOptions = template.options
    ? (template.options.map((optionId) =>
        options.find((o) => o.id === optionId),
      ) as Option[])
    : [];
  const selections = config?.selections || [];

  // build up initial state
  const initalState: ConfigSelections = {};

  initalState[CONFIG_NAME_KEY] = config.name || '';
  selections.map(s => {
    const option = options.find(o => o.id === s.option);
    if (option) {
      initalState[option.name] = s;
    }
  });

  return (
    <ModalOpenContext.Provider value={isOpen}>
      <Fragment>
        <Button onClick={() => setOpen(true)}>Edit</Button>
        <BaseModal
          closeAction={() => setOpen(false)}
          showCloseButton={false}
          css={slideOutCss}
        >
          <Formik
            initialValues={initalState}
            onSubmit={(configSelections: ConfigSelections) => {
              updateConfig(config, configSelections);
              setOpen(false);
            }}
          >
            <Form>
              <Field id={CONFIG_NAME_KEY} name={config.name} placeholder="Name Your New Configuration" />
              <Button
                  type="submit"
                  css={css`

                  `}
                >
                Save
              </Button>
              {systemOptions.map((option) => (
                <div key={option.id}>
                  <OptionDisplay
                    option={option}
                    options={options}
                    selections={selections}
                  />
                </div>
              ))}
            </Form>
          </Formik>
        </BaseModal>
      </Fragment>
    </ModalOpenContext.Provider>
  );
};

interface OptionDisplayProps {
  option: Option;
  options: Option[];
  selections: Selection[];
}

const OptionDisplay = ({
  option,
  options,
  selections,
}: OptionDisplayProps) => {
  const optionList =
    (option.options?.map((oID) => options.find((o) => o.id === oID)) || []) as Option[];

  // TODO: will need to conditionally render the option based on 'type' (bool, value, dropdown)

  return (
    <Fragment>
      <Label htmlFor={option.name}>{option.name}</Label>
      <Field as="select" id={option.name} name={option.name}>
        {optionList.map((o) => (
          <option key={o.id} value={o.name}>{o.name}</option>
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
