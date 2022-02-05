import { Fragment } from "react";
import styled from "@emotion/styled";

import { useStore, System, SystemType } from "../../store/store";

import Sidebarlayout from "../layouts/SidebarLayout";

// step 2
const Systems = () => (
  <Sidebarlayout
    heading="Add Systems"
    contentLeft={<ContentLeft />}
    contentRight={<ContentRight />}
  />
);

const ContentLeft = () => {
  const userSystems = useStore((state) => state.userProjects.systems);
  return (
    <ul>
      {userSystems?.map((s) => (
        <li key={s.id}>{s.name}</li>
      ))}
    </ul>
  );
};

const ContentRight = () => {
  const templateSystems = useStore((state) => state.templates);
  if (templateSystems) {
    return (
      <Fragment>
        {SystemGroupList(templateSystems.systemType, templateSystems.system)}
      </Fragment>
    );
  } else {
    return (
      <Fragment>
        <div></div>
      </Fragment>
    );
  }
};

const SystemGroupList = (typeList: SystemType[], systems: System[]) => {
  // TODO: pass callback that matches the display text to the original
  // system and that then calls the zustand set method`
  const userSystems = useStore(
    (state) => state.userProjects.systems,
  ) as System[];
  const addSystem = useStore((state) => state.addSystem);
  const removeSystem = useStore((state) => state.removeSystem);

  return typeList.map((type) =>
    MultiSelect(
      type.name,
      systems
        .filter((s) => s.systemType === type.id)
        .map((s) => {
          const value =
            userSystems?.findIndex((userS) => userS.id === s.id) >= 0;
          return { text: s.name, value: value };
        }),
      (selection, value) => {
        const system = systems.find((s) => s.name === selection);
        if (system) {
          value ? addSystem(system) : removeSystem(system);
        }
      },
    ),
  );
};

const MultiSelect = (
  title: string,
  options: { text: string; value: boolean }[],
  handler: (s: string, value: boolean) => void,
) => {
  return (
    <Fragment key={title}>
      <div>
        <h3>{title}</h3>
        {options.map((option) =>
          OptionSelect(option.text, option.value, handler),
        )}
      </div>
    </Fragment>
  );
};

const OptionSelect = (
  text: string,
  value: boolean,
  handler: (text: string, value: boolean) => void,
) => {
  return (
    <Fragment key={text}>
      <div>
        <OptionLabel htmlFor="selected">{text}</OptionLabel>
        <Checkbox
          id="selected"
          name="selected"
          type="checkbox"
          checked={value}
          onChange={(e) => handler(text, e.target.checked)}
        ></Checkbox>
      </div>
    </Fragment>
  );
};

const OptionLabel = styled.label`
  display: inline-block;
  font-weight: bold;
`;

const Checkbox = styled.input`
  display: inline-block;
`;
const Container = styled.div`
  width: 100%;
`;

export default Systems;
