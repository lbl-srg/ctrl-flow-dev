import { useStore } from "../../store/store";
import System from "./System";
import "../../styles/components/left-navigation.scss";

const LeftNav = () => {
  const { configs, systemTypes, meta } = useStore((state) => ({
    configs: state.getActiveProject().configs,
    meta: state.getActiveProject().metaConfigs,
    systemTypes: state.systemTypes,
  }));

  // console.log("config:", configs);
  // console.log("meta:", meta);

  const userSystemsSet = new Set(configs.map((c) => c.template));
  const systems = Array.from(userSystemsSet.values());

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
