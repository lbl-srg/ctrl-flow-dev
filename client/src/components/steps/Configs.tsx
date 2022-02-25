/** @jsxRuntime classic */
/** @jsx jsx */
import { css, jsx } from "@emotion/react/macro";
import styled from "@emotion/styled";
import { Fragment, useState } from "react";
import Sidebarlayout from "../layouts/SidebarLayout";
import SlideOut from "../modal/ConfigSlideOut";

import { colors } from "../../styleHelpers";

import { useStore, Configuration, System, SystemType } from "../../store/store";

import LeftNav from "../LeftNavigation";
import { TextButton } from "../Button";

// step 3
const Configs = () => {
  const {
    configs,
    userSystems,
    systemTypes,
    templates,
    addConfig,
    removeConfig,
  } = useStore((state) => ({
    configs: state.userProjects.configurations,
    userSystems: state.userProjects.systems,
    systemTypes: state.systemTypes,
    templates: state.templates,
    addConfig: state.addConfig,
    removeConfig: state.removeConfig,
  }));
  return (
    <Sidebarlayout
      heading="Configurations"
      contentLeft={<LeftNav />}
      contentRight={
        <Fragment>
          <div>Add Configurations For The System Types You Selected</div>
          {systemTypes.map((systemT) => {
            const systems = userSystems.filter(
              (s) => s.systemType === systemT.id,
            );
            const confs = configs.filter((c) =>
              systems.map((s) => s.id).includes(c.system),
            );

            return (
              <SystemConfigGroup
                key={systemT.id}
                systemType={systemT}
                systems={systems}
                configs={confs}
                addConfig={addConfig}
                removeConfig={removeConfig}
              />
            );
          })}
        </Fragment>
      }
    />
  );
};

interface SystemConfigGroupProps {
  systemType: SystemType;
  systems: System[];
  configs: Configuration[];
  addConfig: (system: System) => void;
  removeConfig: (config: Configuration) => void;
}

const SystemConfigGroup = ({
  systemType,
  systems,
  configs,
  addConfig,
  removeConfig,
}: SystemConfigGroupProps) => {
  return (
    <Fragment>
      <h3>{systemType.name}</h3>
      {systems.map((system) => (
        <SystemConfigs
          key={system.id}
          system={system}
          configs={configs.filter((c) => c.system === system.id)}
          addConfig={addConfig}
          removeConfig={removeConfig}
        />
      ))}
    </Fragment>
  );
};

interface SystemConfigsProps {
  system: System;
  configs: Configuration[];
  addConfig: (system: System) => void;
  removeConfig: (config: Configuration) => void;
}

const SystemConfigs = ({
  system,
  configs,
  addConfig,
  removeConfig,
}: SystemConfigsProps) => {
  return (
    <SystemConfigsContainer>
      <SystemTitleContainer>
        <SystemName>{system.name}</SystemName>
        <UploadDownload path=''></UploadDownload>
      </SystemTitleContainer>
      <div css={css`text-transform: uppercase; font-size: 0.8rem; font-weight: 600; padding: 0.3rem 0rem;`}>
        Configuration(s):
      </div>
      {configs.map((c) => (
        <Config
          key={c.id}
          config={c}
          system={system}
          removeConfig={removeConfig}
        />
      ))}
      <TextButton css={css`padding-left:0rem; padding-bottom: 1.5rem; font-size: 1rem;`}onClick={() => addConfig(system)}>
        + Add Configuration
      </TextButton>
    </SystemConfigsContainer>
  );
};

const SystemConfigsContainer = styled.div`
  background-color: ${colors.extraLightBlue};
  padding: 0rem 0.75rem;
`;

interface UploadDownloadProps {
  path: string; // file path
}
const UploadDownload = ({ path }: UploadDownloadProps) => {
  const buttonCss = css`
    font-size: 0.8rem;
    color: ${colors.mediumBlue};
    padding: 0 0.5rem;
    text-transform: none;
  `;
  return (
    <Fragment>
      <FileAction>
        <TextButton css={buttonCss}>Download</TextButton>
      </FileAction>
      <FileAction>
        <TextButton css={buttonCss}>Upload</TextButton>
      </FileAction>
    </Fragment>
  );
};

const FileAction = styled.div`
  display: inline;
`;

const SystemTitleContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  padding: 1rem 0rem;
`;

const SystemName = styled.div`
  font-weight: bold;
  flex: 1;
`;

interface ConfigProps {
  config: Configuration;
  system: System;
  removeConfig: (config: Configuration) => void;
}

const Config = ({ config, system, removeConfig }: ConfigProps) => {
  const [inHover, setHover] = useState(false);

  return (
    <ConfigContainer
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <ConfigNameEditContainer>
        <ConfigName>{config.name}</ConfigName>
        <SlideOut config={config} template={system} />
      </ConfigNameEditContainer>
      <TextButton
        css={inHover ? css`visibility: visible;` : css`visibility: hidden;`}
        onClick={() => removeConfig(config)}>
        X
      </TextButton>
    </ConfigContainer>
  );
};

const ConfigName = styled.div`
  flex: 1;
`;

const ConfigNameEditContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  outline: 1px solid ${colors.mediumGrey};
  width: 100%;
  padding: 0.5rem 0.9rem;
  align-items: center;
`

const ConfigContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin: 0.5rem 0rem;
`;

export default Configs;
