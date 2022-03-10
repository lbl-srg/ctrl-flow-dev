import { Fragment } from "react";
import Button from "../Button";

import { Formik, Field, Form } from "formik";
import PageHeader from "../PageHeader";
import {
  useStore,
  Configuration,
  UserSystem,
  SystemTemplate,
} from "../../store/store";

import { SelectInput, SelectInputOption } from "../shared/SelectInput";
import {
  AddUserSystemsAction,
  SystemWidgetForm,
  AddUserSystemsWidgetProps,
  UserSystemsProps,
} from "./Schedules/Types";

function Schedules() {
  const template = useStore((state) => state.getActiveTemplate());
  const configs = useStore((state) => state.getConfigs());
  // Order of attempting to get a currently active template:
  // 1. try the 'activeTemplate' from the store
  // 2. otherwise get the first config found and get its template
  // 3. leave undefined - no configs or user systems will show
  const [firstConf, ..._rest] = configs;
  const activeTemplate = template ? template : firstConf?.template;
  const templateConfigs = activeTemplate
    ? configs.filter((c) => c.template.id === activeTemplate.id)
    : configs;
  const userSystems = useStore((state) => state.getUserSystems(template));
  const removeUserSystem = useStore((state) => state.removeUserSystem);

  return (
    <Fragment>
      <PageHeader headerText="Schedules" />
      <AddUserSystemsWidget configs={templateConfigs} />
      <button onClick={() => userSystems.map((s) => removeUserSystem(s))}>
        Remove Systems
      </button>
      <UserSystems userSystems={userSystems} />
    </Fragment>
  );
}

function onWidgetSubmit(
  configs: Configuration[],
  formValues: SystemWidgetForm,
  addUserSystems: AddUserSystemsAction,
) {
  const config = configs.find(
    (c) => c.id === Number(formValues.configID),
  ) as Configuration;
  addUserSystems(formValues.tag, formValues.start, formValues.quantity, config);
}

function AddUserSystemsWidget({ configs }: AddUserSystemsWidgetProps) {
  const [config, ..._rest] = configs;
  const initValues = {
    tag: "",
    start: 1,
    quantity: 1,
    configID: config?.id || undefined,
  };
  const addUserSystems = useStore((state) => state.addUserSystems);

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

const UserSystems = ({ userSystems }: UserSystemsProps) => {
  return (
    <Fragment>
      <div>
        <pre>
          {JSON.stringify(
            userSystems.map((s) => `${s.tag}: ${s.config.name}`),
            null,
            2,
          )}
        </pre>
      </div>
    </Fragment>
  );
};

export default Schedules;
