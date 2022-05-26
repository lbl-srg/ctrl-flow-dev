import { Fragment, useEffect, useState } from "react";
import { Field, Form, Formik, FormikProps } from "formik";
import Debug from "../debug";
import Modal from "./Modal";

import { SelectInput } from "../shared/SelectInput";
import "../../styles/components/config-slide-out.scss";

import { getSelections, ConfigFormValues } from "../../utils/FormHelpers";
import itl from "../../translations";

// import { useStore, Option } from "../../store/store";

import { useStores } from "../../data";

const SlideOut = ({ configId }) => {
  const { configStore, uiStore, templateStore } = useStores();

  const config = configStore.getById(configId);
  const template = templateStore.getTemplateByPath(config.templatePath);

  const [isOpen, setOpen] = useState(false);

  const options = templateStore.getOptionsForTemplate(template.modelicaPath);

  // const updateConfig = useStore((state) => state.updateConfig);
  // const { getTemplateOptions, setOpenSystemId } = useStore((state) => state);
  // const [initTemplateOptions, fullTemplateOptions] =
  //   getTemplateOptions(template);

  // const initSelections = config.selections.reduce(
  //   (previousValue, currentValue) => {
  //     previousValue[currentValue.parent.name] = currentValue.option.id;
  //     return previousValue;
  //   },
  //   {},
  // );

  // const [initialValues, setInitialValues] = useState({
  //   configName: config.name || "",
  //   ...initSelections,
  // });

  // grabs the updates if the name has changed since initialized
  useEffect(() => {
    // setInitialValues({ ...initialValues, configName: config.name });
  }, [config]);

  function openPanel() {
    setOpen(true);
    uiStore.setOpenSystemPath(config.systemPath);
  }

  function save(ev) {
    ev.preventDefault();
    ev.stopPropagation();
    console.log(ev.target);
  }

  return (
    <Fragment>
      <button disabled={config.isLocked} className="small" onClick={openPanel}>
        {itl.terms.edit}
      </button>
      <Modal
        close={() => setOpen(false)}
        isOpen={isOpen}
        className="config-slide-out"
      >
        <h3>{template.name}</h3>

        <form onSubmit={save}>
          <input
            type="text"
            id="configName"
            name="configName"
            defaultValue={config.name}
            placeholder="Name Your Configuration"
          />
          {/* {initTemplateOptions.map((option) => (
            <OptionDisplay
            option={option}
            options={fullTemplateOptions}
            formik={formik}
            key={option.id}
            />
          ))} */}

          <Debug item={options} />

          <button type="submit">{itl.terms.save}</button>
        </form>
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
