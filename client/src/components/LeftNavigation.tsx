/** @jsxRuntime classic */
/** @jsx jsx */
import { css, jsx } from "@emotion/react/macro";
import { Fragment } from "react";
import styled from "@emotion/styled";

import { useStore, SystemTemplate, SystemType, Configuration } from "../store/store";

import { colors } from "../styleHelpers";

const LeftNav = () => {
  const { configs, systemTypes } = useStore((state) => ({
    configs: state.getActiveProject().configs,
    systemTypes: state.systemTypes,
  }));

  const userSystemsSet = new Set(configs.map(c => c.template));
  const userSystems = Array.from(userSystemsSet.values());

  return (
    <SystemGroupList
      systemTypes={systemTypes}
      systems={userSystems}
      configs={configs}
    />
  );
};

interface SystemGroupListProps {
  systemTypes: SystemType[];
  systems: SystemTemplate[];
  configs: Configuration[];
}

const SystemGroupList = ({
  systemTypes,
  systems,
  configs,
}: SystemGroupListProps) => {
  return (
    <Fragment>
      {systemTypes.map((systemType) => (
        <SystemGroup
          key={systemType.id}
          systemType={systemType}
          templates={systems.filter((s) => s.systemType.id === systemType.id)}
          configs={configs}
        />
      ))}
    </Fragment>
  );
};

interface SystemGroupProps {
  systemType: SystemType;
  templates: SystemTemplate[];
  configs: Configuration[];
}

const SystemGroup = ({ systemType, templates, configs }: SystemGroupProps) => {
  return (
    <Fragment>
      <SystemTypeTitle href={`#${systemType.name}`}>
        <h3>{systemType.name}</h3>
      </SystemTypeTitle>
      {templates.map((t) => (
        <UserSystem
          key={t.id}
          template={t}
          configs={configs.filter((c) => c.template.id === t.id)}
        />
      ))}
    </Fragment>
  );
};

interface SystemProp {
  template: SystemTemplate;
  configs: Configuration[];
}

const UserSystem = ({ template, configs }: SystemProp) => {
  return (
    <a
      key={template.id}
      href={`#${template.name}-${template.name}`}
      css={css`
        text-decoration: none;
      `}
    >
      <SystemTitle>{template.name}</SystemTitle>
      {configs.map((c) => (
        <ConfigTitle key={c.id}>{c.name}</ConfigTitle>
      ))}
    </a>
  );
};

const SystemTypeTitle = styled.a`
  color: ${colors.mediumBlue};
  text-decoration: none;
`;

const SystemTitle = styled.div`
  color: ${colors.mediumBlue};
  font-size: 1rem;
  text-decoration: none;
`;

const ConfigTitle = styled.div`
  font-size: 0.8rem;
  text-decoration: none;
  padding-left: 1rem;
  color: ${colors.mediumBlue};
  font-weight: bold;
`;

export default LeftNav;
