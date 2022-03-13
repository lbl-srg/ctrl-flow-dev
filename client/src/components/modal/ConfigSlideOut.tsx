import { Fragment, useEffect, useState } from "react";
import { Field, Form, Formik, FormikProps } from "formik";

import Modal from "./Modal";

import { SelectInput } from "../shared/SelectInput";
import "../../styles/components/config-slide-out.scss";

import { getSelections, ConfigFormValues } from "../../utils/FormHelpers";

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
  const updateConfig = useStore((state) => state.updateConfig);
  const getTemplateOptions = useStore((state) => state.getTemplateOptions);
  const [initTemplateOptions, fullTemplateOptions] =
    getTemplateOptions(template);

  const initSelections = config.selections.reduce(
    (previousValue: { [key: string]: number }, currentValue: Selection) => {
      previousValue[currentValue.parent.name] = currentValue.option.id;
      return previousValue;
    },
    {},
  );

  const [initialValues, setInitialValues] = useState({
    configName: config.name || "",
    ...initSelections,
  });

  // grabs the updates if the name has changed since initialized
  useEffect(() => {
    setInitialValues({ ...initialValues, configName: config.name });
  }, [config]);

  return (
    <Fragment>
      <button className="small" onClick={() => setOpen(true)}>
        Edit
      </button>
      <Modal
        close={() => setOpen(false)}
        isOpen={isOpen}
        className="config-slide-out"
      >
        <h3>{template.name}</h3>
        <Formik
          initialValues={initialValues}
          enableReinitialize={true}
          onSubmit={(configSelections: ConfigFormValues) => {
            const selections = getSelections(
              configSelections,
              initSelections,
              fullTemplateOptions,
            );
            const configName = configSelections.configName;
            updateConfig(config, configName, selections);
            setOpen(false);
          }}
        >
          {(formik) => (
            <Form
              onChange={(e) => {
                const target = e.target as any;
                const newValue: { [key: string]: any } = {};
                // TODO: this will not work once we start incorporating more types of input
                // For example, this would also fail if a config is given a number as a name
                // we'll need to be able to make intelligent decisions about how to cast input.
                // use option name
                const value = isNaN(target.value)
                  ? target.value
                  : Number(target.value);
                newValue[target.name] = value;
                setInitialValues({ ...initialValues, ...newValue });
              }}
            >
              <Field
                id="configName"
                name="configName"
                placeholder="Name Your New Configuration"
              />
              {initTemplateOptions.map((option) => (
                <OptionDisplay
                  option={option}
                  options={fullTemplateOptions}
                  formik={formik}
                  key={option.id}
                />
              ))}

              <button type="submit">Save</button>
            </Form>
          )}
        </Formik>
      </Modal>
    </Fragment>
  );
};

const constructOption = ({
  option,
  options,
}: {
  option: Option;
  options: Option[];
}) => {
  switch (option.type) {
    case "dropdown": {
      // TODO: figure out why 'option.options' is an array of
      // numbers and not an array of options
      const optionList = (option.options?.map((childO) =>
        options.find((o) => o.id === childO.id),
      ) || []) as Option[];
      return (
        <SelectInput
          id={option.name}
          name={option.name}
          label={option.name}
          options={optionList}
        />
      );
    }
    default:
      // TODO: implement other input types
      return null;
  }
};

interface OptionDisplayProps {
  option: Option;
  options: Option[];
  formik: FormikProps<ConfigFormValues>;
}

const OptionDisplay = ({ option, options, formik }: OptionDisplayProps) => {
  const childOption = options.find((o) => o.id === formik.values[option.name]);

  return (
    <Fragment>
      {constructOption({ option, options })}
      {childOption && (
        <OptionDisplay option={childOption} options={options} formik={formik} />
      )}
    </Fragment>
  );
};

export default SlideOut;
