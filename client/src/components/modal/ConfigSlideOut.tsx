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

export type ConfigUpdates = {configName: string;} & {[key: string]: number}


const handleSubmit = (
  configUpdates: ConfigUpdates,
  config: Configuration,
  systemOptions: Option[],
  updateConfig: (config: Partial<Configuration> & { id: number; system: number }, configName: string, selections: Option[]) => void) => {
  // use the selection key to grab the parent option
  // remove previous selection (if present), add new selection

  const { configName, ...selections } = configUpdates;

  for (const [parentOptionName, optionId] of Object.entries(selections)) {
    // TODO: might be worth putting 'parentOption' as attribute on options
    const parentOption = systemOptions.find(o => o.name === parentOptionName);
    // check if there is an existing selection for the parent option and remove it
    // By the end of this process previous selections should be trimmed
  }

  // const selectedOptions = selections.map(sID => systemOptions.find(sOption => sOption.id === sID))

  updateConfig(config, configName, selections)
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

  // build up initial state
  const initalState: ConfigUpdates = {configName: config.name || '', options: selections};

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
            onSubmit={(configSelections: ConfigUpdates) => {
              console.log(configSelections);
              handleSubmit(configSelections, config, systemOptions, updateConfig)
              setOpen(false);
            }}
          >
            <Form>
              <Field id="configName" name={config.name} placeholder="Name Your New Configuration" />
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
