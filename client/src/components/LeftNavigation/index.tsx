import { useStore } from "../../store/store";
import System from "./System";

import { deduplicate } from "../../utils/utils";

import "../../styles/components/left-navigation.scss";

const LeftNav = () => {
  const { configs, systemTypes, meta } = useStore((state) => ({
    configs: state.getActiveProject().configs,
    meta: state.getActiveProject().getMetaConfigs(),
    systemTypes: state.systemTypes,
  }));

  const systems = deduplicate(configs.map((c) => c.template));

  return (
    <div className="left-nav">
      <h4>Systems</h4>

      {systemTypes.map((systemType) => (
        <System
          key={systemType.id}
          systemType={systemType}
          templates={systems.filter((s) => s.systemType.id === systemType.id)}
          configs={configs}
        />
      ))}
    </div>
  );
};

export default LeftNav;
