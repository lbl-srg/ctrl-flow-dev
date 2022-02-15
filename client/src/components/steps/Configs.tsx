import { Fragment } from "react";
import Sidebarlayout from "../layouts/SidebarLayout";
import SlideOut from "../modal/ConfigSlideOut";

import { useStore, Configuration, System, SystemType } from "../../store/store";

// step 3
const Configs = () => {
  const { configs, userSystems, systemTypes, templates } = useStore((state) => ({
    configs: state.userProjects.configurations,
    userSystems: state.userProjects.systems,
    systemTypes: state.systemTypes,
    templates: state.templates
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
}

const SystemConfigGroup = ({systemType, systems, configs}: SystemConfigGroupProps) => {
  return (
    <Fragment>
      <h3>{systemType.name}</h3>
      {
        systems.map(system =>
          <SystemConfigs
            key={system.id}
            system={system}
            configs={configs.filter(c => c.system === system.id)}
          />
        )
      }
    </Fragment>  
  )
}

interface SystemConfigsProps {
  system: System;
  configs: Configuration[];
}

const SystemConfigs = ({system, configs}: SystemConfigsProps) => {
  return (
    <Fragment>
      <h4>{system.name}</h4>
      <div>Configuration(s):</div>
      {
        configs.map(c => <Config key= {c.id} config={c} system={system}/>)
      }
      <SlideOut 
        variant="text"
        template={system}
      >
        + Add another configuration
      </SlideOut>
    </Fragment>
  )
}

interface ConfigProps {
  config: Configuration;
  system: System;
}

const Config = ({config, system}: ConfigProps) => {
  return (
    <div>
      <div>{config.name}</div>
      <SlideOut
        variant="button"
        config={config}
        template={system}
      >
        Edit
      </SlideOut>
    </div>
  )
}

export default Configs;
