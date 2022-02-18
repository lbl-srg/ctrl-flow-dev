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
  Configuration,
  System,
  Option,
} from "../../store/store";

interface SlideOutProps {
  template: System;
  config: Configuration;
}

export type ConfigUpdates = & {[key: string]: number | string, configName: string} 


const handleSubmit = (
  configUpdates: ConfigUpdates,
  config: Configuration,
  options: Option[],
  updateConfig: (config: Partial<Configuration> & { id: number; system: number }, configName: string, selections: Option[]) => void) => {

  const { configName, ...selections } = configUpdates;

  const selectedOptions = Object.values(selections)
    .map(sID => options.find(o => o.id === Number(sID)))
    .filter(o => o !== undefined) as Option[];

  updateConfig(config, configName, selectedOptions)
}

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
  const initSelections: {[key: string]: number | string} = {};

  // TODO: determine if options should have a 'parent' field.
  // There may be other places where traversal from child
  // to parent would be helpful
  selections.map(s => {
    const parentOption = systemOptions.find(o => o.options?.includes(s.id));
    if (parentOption) {
      initSelections[parentOption.name] = s.id;
    }
  });


  // build up initial state
  const initialState = {
    configName: config.name || '',
    ...initSelections
  };

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
            initialValues={initialState}
            onSubmit={(configSelections: ConfigUpdates) => {
              handleSubmit(configSelections, config, options, updateConfig)
              setOpen(false);
            }}
          >
            <Form>
              <Field id="configName" name="configName" placeholder="Name Your New Configuration" />
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
  selections: Option[];
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
          <option key={o.id} value={o.id}>{o.name}</option>
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
