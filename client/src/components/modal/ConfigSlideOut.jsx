import { Fragment, useEffect, useState } from "react";
import { Field, Form, Formik, FormikProps } from "formik";

import Modal from "./Modal";

import { SelectInput } from "../shared/SelectInput";
import "../../styles/components/config-slide-out.scss";

import { getSelections, ConfigFormValues } from "../../utils/FormHelpers";
import itl from "../../translations";

import { useStore, Option } from "../../store/store";

const SlideOut = ({ template, config, disabled = true }) => {
  const [isOpen, setOpen] = useState(false);
  const updateConfig = useStore((state) => state.updateConfig);
  const { getTemplateOptions, setOpenSystemId } = useStore((state) => state);
  const [initTemplateOptions, fullTemplateOptions] =
    getTemplateOptions(template);

  const initSelections = config.selections.reduce(
    (previousValue, currentValue) => {
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

  function openPanel() {
    setOpen(true);
    setOpenSystemId(template.systemType.id);
  }

  return (
    <Fragment>
      <button disabled={disabled} className="small" onClick={openPanel}>
        {itl.terms.edit}
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
          onSubmit={(configSelections) => {
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
                const target = e.target;
                const newValue = {};
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

              <button type="submit">{itl.terms.save}</button>
            </Form>
          )}
        </Formik>
      </Modal>
    </Fragment>
  );
};

const constructOption = ({ option, options }) => {
  switch (option.type) {
    case "dropdown": {
      // TODO: figure out why 'option.options' is an array of
      // numbers and not an array of options
      const optionList =
        option.options?.map((childO) =>
          options.find((o) => o.id === childO.id),
        ) || [];
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

const OptionDisplay = ({ option, options, formik }) => {
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