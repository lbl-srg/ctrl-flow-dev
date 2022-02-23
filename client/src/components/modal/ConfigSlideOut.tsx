/** @jsxRuntime classic */
/** @jsx jsx */
import { css, jsx } from "@emotion/react/macro";
import { Fragment, useState } from "react";
import styled from "@emotion/styled";
import { Field, Form, Formik, FormikProps } from "formik";

import Button, { LinkButton } from "../Button";
import { BaseModal, ModalOpenContext } from "./BaseModal";

import { getChangedValues } from "../../utils";

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
    const optionRelation = optionMap[option.id] || {};
    optionRelation.children = option.options?.map(childID => options.find(o => o.id === childID) as Option);

    // initalize children in map
    optionRelation.children?.map(childOption => {
      const childOptionRelation = optionMap[childOption.id] || {};
      childOptionRelation.parent = option;
      optionMap[childOption.id] = childOptionRelation;
    });
    optionMap[option.id] = optionRelation;
  });

  return optionMap;
}

const handleSubmit = (
  configSelections: ConfigFormValues,
  initSelections: ConfigFormValues,
  optionMap: {[key: number]: OptionRelation},
  config: Configuration,
  options: Option[],
  updateConfig: (config: Partial<Configuration> & { id: number; system: number }, configName: string, selections: Option[]) => void) => {
  const { configName, ...confSelections } = configSelections // extract out name
  const changedSelections = getChangedValues(confSelections, initSelections) as ConfigFormValues;
  const parentList: Option[] = Object.values(changedSelections)
    .map(sID => optionMap[Number(sID)].parent)
    .filter(o => o !== undefined) as Option[];

  const selectionsToFilter: string[] = []

  // build up list of options to remove from selection (by parent name string)
  while (parentList.length > 0) {
    const parent = parentList.pop() as Option;
    if (parent) {
      const children = optionMap[parent.id].children;
      if (children) {
        parentList.push(...children);
      }
    }
    selectionsToFilter.push(parent.name);
  }

  // get existing selections, filter out removed options
  const selections = Object.entries(configSelections)
    .filter(([key, _]) => selectionsToFilter.indexOf(key) < 0)
    .map(([_, id]) => options.find(o => o.id === Number(id)))
    .filter(o => o !== undefined) as Option[];

  // get changed options
  const changedOptions = Object.values(changedSelections)
    .map(oID => options.find(o => o.id === Number(oID)))
    .filter(o => o !== undefined) as Option[];

  // append to get full set of options for the current config
  selections.push(...changedOptions);
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
  // const initialValues = {
  //   configName: config.name || '',
  //   ...initSelections
  // };

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
              handleSubmit(configSelections, initialValues, optionMap, config, options, updateConfig)
              setOpen(false);
            }}
          >
            {
              formik => (
                <Form
                  onChange={(e) => {
                    const target = e.target as any;
                    const newValue: {[key: string]: any} = {};
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
