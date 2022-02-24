/** @jsxRuntime classic */
/** @jsx jsx */
import { css, jsx } from "@emotion/react/macro";
import { Fragment, useState } from "react";
import styled from "@emotion/styled";
import { Field, Form, Formik, FormikProps } from "formik";

import Button, { LinkButton } from "../Button";
import { BaseModal, ModalOpenContext } from "./BaseModal";

import {
  getInitialFormValues,
  getSelections,
  ConfigFormValues
} from "../../utils/FormHelpers"

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

  const initSelections = getInitialFormValues(template, config, options);
  const [initialValues, setInitialValues] = useState({
    configName: config.name || '',
    ...initSelections
  })

  return (
    <ModalOpenContext.Provider value={isOpen}>
      <Fragment>
        <Button variant="filledSmall" onClick={() => setOpen(true)}>Edit</Button>
        <BaseModal
          closeAction={() => setOpen(false)}
          showCloseButton={false}
          css={slideOutCss}
        >
          <Formik
            initialValues={initialValues}
            enableReinitialize={true}
            onSubmit={(configSelections: ConfigFormValues) => {
              const selections = getSelections(configSelections, initialValues, config, options)
              const configName = configSelections.configName;
              updateConfig(config, configName, selections)
              setOpen(false);
            }}
          >
            {
              formik => (
                <Form
                  onChange={(e) => {
                    const target = e.target as any;
                    const newValue: {[key: string]: any} = {};
                    // TODO: this will not work once we start incorporating more types of input
                    // 'setInitialValues' should be passed the OptionDisplay component constructor
                    // so we can make intelligent decisions about how to cast input.
                    const value = isNaN(target.value) ? target.value : Number(target.value);
                    newValue[target.name] = value;
                    setInitialValues({...initialValues, ...newValue});
                  }}
                >
                  <Field id="configName" name="configName" placeholder="Name Your New Configuration" />
                  <Button
                      type="submit"
                      css={css`
    
                      `}
                    >
                    Save
                  </Button>
                  {systemOptions.map((option) => (
                    <OptionDisplay
                      option={option}
                      options={options}
                      formik={formik}
                      key={option.id}
                    />
                  ))}
                </Form>
              )
            }
          </Formik>
        </BaseModal>
      </Fragment>
    </ModalOpenContext.Provider>
  );
};

const constructOption = ({
  option,
  options,
}: {option: Option, options: Option[]}) => {
  switch (option.type) {
    case 'dropdown': {
      const optionList =
        (option.options?.map((oID) => options.find((o) => o.id === oID)) || []) as Option[];
      return (
        <Fragment>
          <Label htmlFor={option.name}>{option.name}</Label>
          <Field
            as="select"
            id={option.name}
            name={option.name}>
            {optionList.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </Field>
        </Fragment>        
      )
    }
    default:
      // TODO: implement other input types
      return null; 
  }
}

interface OptionDisplayProps {
  option: Option;
  options: Option[];
  formik: FormikProps<ConfigFormValues>;
}

const OptionDisplay = ({
  option,
  options,
  formik,
}: OptionDisplayProps) => {
  // TODO: onChange needs to re-evaluate this expression... not sure of the best way to do
  // this with formik
  const childOption = options.find(o => o.id === formik.values[option.name]);

  return (
    <Fragment>
      {constructOption({option, options})}
      {childOption && <OptionDisplay
        option={childOption}
        options={options}
        formik={formik}
      />}
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
