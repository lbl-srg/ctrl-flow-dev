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
  const { userSystems, systemTypes } = useStore((state) => 
    ({userSystems: state.userProjects.systems, systemTypes: state.templates?.systemType}));

  return (
      <Fragment>
        {systemTypes?.map(t =>
          <Fragment key={t.name}>
            <a href={`#${t.name}`}><h3>{t.name}</h3></a>
            <ul>
              {userSystems?.filter(s => s.systemType === t.id)
                .map(s => <a  key={s.id} href={`#${t.name}-${s.name}`}><li>{s.name}</li></a>)}
            </ul>
          </Fragment>
        )}
      </Fragment>
  );
};

const ContentRight = () => {
  const templateSystems = useStore((state) => state.templates);
  return (
    <Fragment>
      <div>
        Select the systems types you will configure:
      </div>
      {SystemGroupList(templateSystems.systemType, templateSystems.system)}
    </Fragment>
  );
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
  const helpText =''; // TODO: extract from template

  return (
    <Fragment key={title}>
      <div>
        <a id={title}><h3>{title}</h3></a>
        {options.map((option) =>
          OptionSelect(option.text, option.value, helpText, handler, `${title}-${option.text}`),
        )}
      </div>
    </Fragment>
  );
};

const OptionSelect = (
  text: string,
  value: boolean,
  helpText: string,
  handler: (text: string, value: boolean) => void,
  id?: string
) => {
  id = id || text;
  return (
    <Fragment key={text}>
        <a id={id}>
          <OptionSelectContainer>
            <Checkbox
              id={id}
              name="selected"
              type="checkbox"
              checked={value}
              onChange={(e) => handler(text, e.target.checked)}
            ></Checkbox>
            <OptionLabel htmlFor={id}>{text}</OptionLabel>
            {OptionInfo(helpText)}
          </OptionSelectContainer>
        </a>
    </Fragment>
  );
};

const OptionInfo = (
  text: string
) => {
  return (
    <InfoIcon>[i]</InfoIcon>
  )
}

const OptionLabel = styled.label`
  display: inline-block;
  font-weight: bold;
  flex: 1;
`;

const Checkbox = styled.input`
  display: inline-block;
`;
const OptionSelectContainer = styled.div`
  display: flex;
  justify-content: flex-start;
`;

const InfoIcon = styled.div``

export default Systems;
