import { Fragment } from "react";
import Sidebarlayout from "../layouts/SidebarLayout";
import SlideOut from "../modal/ConfigSlideOut";

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
      <h4>{system.name}</h4>
      <div>Configuration(s):</div>
      {
        configs.map(c => <Config key= {c.id} config={c} system={system} removeConfig={removeConfig}/>)
      }
      <TextButton onClick={() => addConfig(system)}>+ Add Configuration</TextButton>
    </Fragment>
  )
}

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
