/** @jsxRuntime classic */
/** @jsx jsx */
import { css, jsx } from "@emotion/react/macro";
import { Fragment, ReactNode, useState } from "react";
import styled from "@emotion/styled";
import { Field, Form, Formik, FormikProps } from "formik";

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

export type ConfigFormValues = & {[key: string]: number | string, configName: string} 

type OptionRelation = {parent?: Option | undefined, children?: Option[] | undefined};

/**
 * Options are stored as a flat list, but there is a unidirectonal tree of object relations
 * defined by Options having children options. It is helpful to have a map from
 * child to parent to help clear suboptions that are no longer relevant if a parent
 * option changes (formik will not automatically do this for us)
 */
const buildOptionMap = (options: Option[]): {[key: number]: OptionRelation} => {
  const optionMap: {[key: number]: OptionRelation} = {};

  options.map(option => {
    const optionRelation = optionMap[option.id];
    optionRelation.children = option.options?.map(childID => options.find(o => o.id === childID) as Option);

    optionRelation.children?.map(childOption => {
      const childOptionRelation = optionMap[childOption.id] || {};
      childOptionRelation.parent = option;
    })
  });

  return optionMap;
}

const handleSubmit = (
  configUpdates: ConfigFormValues,
  initialConfigValues: ConfigFormValues,
  config: Configuration,
  options: Option[],
  updateConfig: (config: Partial<Configuration> & { id: number; system: number }, configName: string, selections: Option[]) => void) => {

  const { configName, ...selections } = configUpdates;

  const selectedOptions = Object.values(selections)
    .map(sID => options.find(o => o.id === Number(sID)))
    .filter(o => o !== undefined) as Option[];

    // - for each selection
    // - if selection parent in parentList
    //   - if selection has options
    //     - add selection to parentList
    //   - remove parent from parent list // assuming only one selection
    //   - remove selection from selections

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

  selections.map(s => {
    const parentOption = options.find(o => o.options?.includes(s.id));
    if (parentOption) {
      initSelections[parentOption.name] = s.id;
    }
  });

  // TODO: this only needs to be done once and probably does not
  // need to live here.
  const optionMap = buildOptionMap(options);

  // build up initial state
  const initialValues = {
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
            initialValues={initialValues}
            onSubmit={(configSelections: ConfigFormValues) => {
              console.log(initialValues);
              console.log(configSelections);
              handleSubmit(configSelections, initialValues, config, options, updateConfig)
              setOpen(false);
            }}
          >
            {
              formik => (
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
            <Field as="select" id={option.name} name={option.name}>
              {optionList.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </Field>
          </Fragment>        
        ) 
    }
    default:
      return <div>TODO: {option.type}: {option.name}</div>
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
