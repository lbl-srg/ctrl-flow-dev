/** @jsxRuntime classic */
/** @jsx jsx */
import { css, jsx } from "@emotion/react/macro";
import { Fragment, useState } from "react";
import styled from "@emotion/styled";
import { Field, Form, Formik, FormikProps } from "formik";

import Button, { LinkButton } from "../Button";
import { BaseModal, ModalOpenContext } from "./BaseModal";

import { SelectInput } from "../shared/SelectInput";

import {
  getInitialFormValues,
  getSelections,
  ConfigFormValues
} from "../../utils/FormHelpers"

import {
  useStore,
  Configuration,
  SystemTemplate,
  Selection,
  Option,
} from "../../store/store";

interface SlideOutProps {
  template: SystemTemplate;
  config: Configuration;
}

const SlideOut = ({ template, config }: SlideOutProps) => {
  const [isOpen, setOpen] = useState(false);
  const updateConfig = useStore(state => ({updateConfig: state.updateConfig});
  const getTemplateOptions = useStore(state => ({getTemplateOptions: state.getTemplateOptions}));

  const initSelections = config.selections.reduce(
    (previousValue: {[key: string]: number}, currentValue: Selection) => {
      previousValue[currentValue.parent.name] = currentValue.option.id
      return previousValue;
    }, {});

  const [initialValues, setInitialValues] = useState({
    configName: config.name || '',
    ...initSelections
  })

  const templateOptions = template.options || [];

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
              // const selections = getSelections(configSelections)
              // const configName = configSelections.configName;
              // updateConfig({config, configName, selections})
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
                    // For example, this would also fail if a config is given a number as a name
                    // we'll need to be able to make intelligent decisions about how to cast input.
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
                  {templateOptions.map((option) => (
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
      const selectionList =
        (option.options?.map((childO) => options.find((o) => o.id === childO.id)) || []) as Option[];
      return (
        <SelectInput
          id={option.name}
          name={option.name}
          selections={selectionList}
        />     
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
