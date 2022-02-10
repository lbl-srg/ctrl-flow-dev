import { Fragment, ReactNode, FC } from "react";
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
  const { userSystems, systemTypes } = useStore((state) => ({
    userSystems: state.userProjects.systems,
    systemTypes: state.systemTypes,
  }));

  return <SystemGroupList systemTypes={systemTypes} systems={userSystems} />;
};

interface SystemGroupListProps {
  systemTypes: SystemType[];
  systems: System[];
}

const SystemGroupList = ({ systemTypes, systems }: SystemGroupListProps) => {
  return (
    <Fragment>
      {systemTypes.map((systemType) => (
        <SystemGroup
          key={systemType.id}
          systemType={systemType}
          systems={systems.filter((s) => s.systemType === systemType.id)}
        />
      ))}
    </Fragment>
  );
};

interface SystemGroupProps {
  systemType: SystemType;
  systems: System[];
}

const SystemGroup = ({ systemType, systems }: SystemGroupProps) => {
  return (
    <Fragment>
      <a href={`#${systemType.name}`}>
        <h3>{systemType.name}</h3>
      </a>
      {systems.map((s) => (
        <UserSystem key={s.id} system={s} />
      ))}
    </Fragment>
  );
};

interface SystemProp {
  system: System;
}

const UserSystem = ({ system }: SystemProp) => {
  return (
    <a key={system.id} href={`#${system.name}-${system.name}`}>
      <li>{system.name}</li>
    </a>
  );
};

const ContentRight = () => {
  const { templateSystems, systemTypes } = useStore((state) => ({
    templateSystems: state.templates.systems,
    systemTypes: state.systemTypes,
  }));

  return (
    <Fragment>
      <div>Select the systems types you will configure:</div>
      <TemplateGroupList
        systemTypes={systemTypes}
        templateSystems={templateSystems}
      />
    </Fragment>
  );
};

interface TemplateGroupListProps {
  systemTypes: SystemType[];
  templateSystems: System[];
}

const TemplateGroupList = ({
  systemTypes,
  templateSystems,
}: TemplateGroupListProps) => {
  const userSystems = useStore((state) => state.userProjects.systems);
  const addSystem = useStore((state) => state.addSystem);
  const removeSystem = useStore((state) => state.removeSystem);

  const handler = (selection: string, value: boolean) => {
    const system = templateSystems.find((s) => s.name === selection);
    if (system) {
      value ? addSystem(system) : removeSystem(system);
    }
  };

  return (
    <Fragment>
      {systemTypes.map((systemType) => (
        <MultiSelect
          key={systemType.id}
          title={systemType.name}
          options={templateSystems
            .filter((s) => s.systemType === systemType.id)
            .map((s) => {
              const value =
                userSystems.findIndex((userS) => userS.id === s.id) >= 0;
              return { text: s.name, value: value };
            })}
          handler={handler}
        />
      ))}
    </Fragment>
  );
};

interface MultiSelectProps {
  title: string;
  options: { text: string; value: boolean }[];
  handler: (s: string, value: boolean) => void;
}

const MultiSelect = ({ title, options, handler }: MultiSelectProps) => {
  const helpText = ""; // TODO: extract from template

  return (
    <Fragment key={title}>
      <div>
        <a id={title}>
          <h3>{title}</h3>
        </a>
        {options.map((option) => (
          <OptionSelect
            text={option.text}
            value={option.value}
            helpText={helpText}
            handler={handler}
            id={`${title}-${option.text}`}
            key={`${title}-${option.text}`}
          />
        ))}
      </div>
    </Fragment>
  );
};

interface OptionSelectProps {
  text: string;
  value: boolean;
  helpText: string;
  handler: (text: string, value: boolean) => void;
  id: string;
}

const OptionSelect = ({
  text,
  value,
  helpText,
  handler,
  id,
}: OptionSelectProps) => {
  return (
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
        <OptionInfo infoText="" />
      </OptionSelectContainer>
    </a>
  );
};

interface OptionInfoProps {
  infoText: string;
}

const OptionInfo = ({ infoText }: OptionInfoProps) => {
  return <InfoIcon>[i]</InfoIcon>;
};

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

const InfoIcon = styled.div``;

export default Systems;
