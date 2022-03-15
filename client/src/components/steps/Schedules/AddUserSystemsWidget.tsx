import { useStore, Configuration } from "../../../store/store";
import {
  AddUserSystemsWidgetProps,
  SystemWidgetForm,
  AddUserSystemsAction,
} from "./Types";
import { SelectInput, SelectInputOption } from "../../shared/SelectInput";
import { Formik, Field, Form } from "formik";

function AddUserSystemsWidget({ configs }: AddUserSystemsWidgetProps) {
  const { addUserSystems, activeConfig } = useStore((state) => {
    return { ...state, activeConfig: state.getActiveConfig() };
  });

  const config = activeConfig || configs[0];

  const initValues = {
    tag: "",
    start: 1,
    quantity: 1,
    configID: config?.id || undefined,
  };

  function onWidgetSubmit(
    configs: Configuration[],
    formValues: SystemWidgetForm,
    addUserSystems: AddUserSystemsAction,
  ) {
    const config = configs.find(
      (c) => c.id === Number(formValues.configID),
    ) as Configuration;
    addUserSystems(
      formValues.tag,
      formValues.start,
      formValues.quantity,
      config,
    );
  }

  return (
    <Formik
      enableReinitialize={true}
      initialValues={initValues}
      onSubmit={(values) =>
        onWidgetSubmit(
          configs,
          values as SystemWidgetForm, // TODO: remove cast once we have proper form valildation
          addUserSystems,
        )
      }
    >
      <Form>
        <label htmlFor="tag">System Tag</label>

        <Field id="tag" name="tag" placeholder="" />
        <label htmlFor="start">ID #</label>
        <Field id="start" name="start" type="number" placeholder="1" />
        <SelectInput
          id="configID"
          name="configID"
          label="Configuration"
          options={configs as SelectInputOption[]}
          defaultOption={config as SelectInputOption}
        />
        <label htmlFor="quantity">Quantity</label>
        <Field id="quantity" name="quantity" type="number" placeholder="1" />
        <button type="submit">Apply</button>
      </Form>
    </Formik>
  );
}

export default AddUserSystemsWidget;
