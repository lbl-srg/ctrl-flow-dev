/** @jsxRuntime classic */
/** @jsx jsx */
import { css, jsx } from "@emotion/react/macro";
import styled from "@emotion/styled";
import { Fragment } from "react";
import Sidebarlayout from "../layouts/SidebarLayout";
import SlideOut from "../modal/ConfigSlideOut";

import { colors } from "../../styleHelpers";

import { useStore, Configuration, System, SystemType } from "../../store/store";

import { TextButton } from "../Button";

// step 3
const Configs = () => {
  const { configs, userSystems, systemTypes, templates, addConfig, removeConfig } = useStore((state) => ({
    configs: state.userProjects.configurations,
    userSystems: state.userProjects.systems,
    systemTypes: state.systemTypes,
    templates: state.templates,
    addConfig: state.addConfig,
    removeConfig: state.removeConfig
  }));
  return (
  <Sidebarlayout
    heading="Configurations"
    contentLeft={<p>hello</p>}
    contentRight={
      <Fragment>
        <div>Add Configurations For The System Types You Selected</div>
        {
          systemTypes.map( systemT => {
            const systems = userSystems.filter(s => s.systemType === systemT.id);
            const confs = configs.filter(c => systems.map(s => s.id).includes(c.system))

            return <SystemConfigGroup
              key={systemT.id}
              systemType={systemT}
              systems={systems}
              configs={confs}
              addConfig={addConfig}
              removeConfig={removeConfig}
            />
          })
        }
      </Fragment>
    }
  />
  )
};

interface SystemConfigGroupProps {
  systemType: SystemType;
  systems: System[];
  configs: Configuration[];
  addConfig: (system: System) => void;
  removeConfig: (config: Configuration) => void;
}

const SystemConfigGroup = ({systemType, systems, configs, addConfig, removeConfig}: SystemConfigGroupProps) => {
  return (
    <Fragment>
      <h3>{systemType.name}</h3>
      {
        systems.map(system =>
          <SystemConfigs
            key={system.id}
            system={system}
            configs={configs.filter(c => c.system === system.id)}
            addConfig={addConfig}
            removeConfig={removeConfig}
          />
        )
      }
    </Fragment>  
  )
}

interface SystemConfigsProps {
  system: System;
  configs: Configuration[];
  addConfig: (system: System) => void;
  removeConfig: (config: Configuration) => void;
}

const SystemConfigs = ({system, configs, addConfig, removeConfig}: SystemConfigsProps) => {
  return (
    <Fragment>
      <SystemConfigName system={system} />
      <div>Configuration(s):</div>
      {
        configs.map(c => <Config key= {c.id} config={c} system={system} removeConfig={removeConfig}/>)
      }
      <TextButton onClick={() => addConfig(system)}>+ Add Configuration</TextButton>
    </Fragment>
  )
}

interface SystemConfigNameProps {
  system: System;
}

const SystemConfigName = ({system}: SystemConfigNameProps) => {
  return (
    <SystemConfigNameContainer>
        <SystemName>{system.name}</SystemName>
        <UploadDownload path={`${system.name}`}></UploadDownload>
    </SystemConfigNameContainer>
  )
}

interface UploadDownloadProps {
  path: string; // file path
}
const UploadDownload = ({path}: UploadDownloadProps) => {
  const buttonCss = css`
    font-size: 0.8rem;
    color: ${colors.mediumBlue};
    padding: 0 0.5rem;
    text-transform: none;
  `
  return (
    <Fragment>
        <FileAction><TextButton css={buttonCss}>Download</TextButton></FileAction>
        <FileAction><TextButton css={buttonCss}>Upload</TextButton></FileAction>      
    </Fragment>
  )
}

const FileAction = styled.div`
  display: inline;
`


const SystemConfigNameContainer = styled.div`
  display: flex;
  justify-content: flex-start;
`

const SystemName = styled.div`
  font-weight: bold;
  flex: 1;
`
interface ConfigProps {
  config: Configuration;
  system: System;
  removeConfig: (config: Configuration) => void;
}

const Config = ({config, system, removeConfig}: ConfigProps) => {
  return (
    <div>
      <div>{config.name}</div>
      <SlideOut config={config} template={system} />
      <TextButton onClick={()=> removeConfig(config)}>X</TextButton>
    </div>
  )
}

export default Configs;
