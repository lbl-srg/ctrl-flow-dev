import { Fragment } from "react";
import Button from "../Button";

import { Formik, Field, Form } from "formik";
import PageHeader from "../PageHeader";
import { useStore, Configuration, UserSystem } from "../../store/store";

import { SelectInput, SelectInputOption } from "../shared/SelectInput";

function Schedules() {
  const userSystems = useStore((state) => state.getUserSystems());
  const removeUserSystem = useStore((state) => state.removeUserSystem);

  return (
    <Fragment>
      <PageHeader headerText="Schedules" />
      <AddUserSystemsWidget />
      <button onClick={() => userSystems.map((s) => removeUserSystem(s))}>
        DEBUG - Remove Systems
      </button>
      <UserSystems userSystems={userSystems} />
    </Fragment>
  );
}

function AddUserSystemsWidget() {
  const addUserSystems = useStore((state) => state.addUserSystems);
  const configs = useStore((state) => state.getConfigs());
  const multiZoneConfigs = configs.filter((c) => c.template.id === 1); // multi-zone VAV
  const [firstConfig, ...others] = multiZoneConfigs;
  const initValues = {
    tag: "",
    start: 1,
    quantity: 1,
    configID: firstConfig?.id || undefined,
  };
  return (
    <Formik
      initialValues={initValues}
      onSubmit={(values) => {
        const config = configs.find(
          (c) => c.id === Number(values.configID),
        ) as Configuration;
        addUserSystems(values.tag, values.start, values.quantity, config);
      }}
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
          options={multiZoneConfigs as SelectInputOption[]}
          defaultOption={firstConfig as SelectInputOption}
        />
        <label htmlFor="quantity">Quantity</label>
        <Field id="quantity" name="quantity" type="number" placeholder="1" />
        <button type="submit">Apply</button>
      </Form>
    </Formik>
  );
}

interface UserSystemsProps {
  userSystems: UserSystem[];
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
