import { Fragment, useState } from "react";
import { Field, Form, Formik, FormikProps } from "formik";
import Modal from "./Modal";
import { SelectInput } from "../shared/SelectInput";

import {
  getInitialFormValues,
  getSelections,
  ConfigFormValues,
} from "../../utils/FormHelpers";

import { useStore, Configuration, System, Option } from "../../store/store";
import "../../styles/components/config-slide-out.scss";

interface SlideOutProps {
  template: System;
  config: Configuration;
}

const SlideOut = ({ template, config }: SlideOutProps) => {
  const [isOpen, setOpen] = useState(false);
  const { options, updateConfig } = useStore((state) => ({
    options: state.templates.options,
    updateConfig: state.updateConfig,
  }));

  const systemOptions = template.options
    ? (template.options.map((optionId) =>
        options.find((o) => o.id === optionId),
      ) as Option[])
    : [];

  const initSelections = getInitialFormValues(template, config, options);
  const [initialValues, setInitialValues] = useState({
    configName: config.name || "",
    ...initSelections,
  });

  return (
    <Fragment>
      <button className="outline small" onClick={() => setOpen(true)}>
        Edit
      </button>
      <Modal
        close={() => setOpen(false)}
        isOpen={isOpen}
        className="config-slide-out"
      >
        <h2>{template.name}</h2>

        <Formik
          initialValues={initialValues}
          enableReinitialize={true}
          onSubmit={(configSelections: ConfigFormValues) => {
            const selections = getSelections(
              configSelections,
              initialValues,
              options,
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
                // This would also fail if a config is given a number as a name
                // 'setInitialValues' should be passed the OptionDisplay component constructor
                // so we can make intelligent decisions about how to cast input.
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
              {systemOptions.map((option) => (
                <OptionDisplay
                  option={option}
                  options={options}
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
      const selectionList = (option.options?.map((oID) =>
        options.find((o) => o.id === oID),
      ) || []) as Option[];
      return (
        <SelectInput
          id={option.name}
          name={option.name}
          selections={selectionList}
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
