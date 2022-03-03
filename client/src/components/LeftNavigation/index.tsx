import { useStore } from "../../store/store";
import System from "./System";
import "../../styles/components/left-navigation.scss";

const LeftNav = () => {
  const { configs, systemTypes } = useStore((state) => ({
    configs: state.getActiveProject().configs,
    systemTypes: state.systemTypes,
  }));

  const userSystemsSet = new Set(configs.map((c) => c.template));
  const systems = Array.from(userSystemsSet.values());

  return (
    <div className="left-nav">
      <h3>Systems</h3>
      <ul className="systems">
        {systemTypes.map((systemType) => (
          <System
            key={systemType.id}
            systemType={systemType}
            templates={systems.filter((s) => s.systemType.id === systemType.id)}
            configs={configs}
          />
        ))}
      </ul>
    </div>
  );
};

export default LeftNav;
