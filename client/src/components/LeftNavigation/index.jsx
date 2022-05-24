import { useStore } from "../../store/store";
import System from "./System";
import itl from "../../translations";

import "../../styles/components/left-navigation.scss";

const LeftNav = () => {
  const { systemTypes, meta, getTemplatesForSystem } = useStore((state) => ({
    ...state,
    meta: state.getMetaConfigs(),
  }));

  return (
    <div className="left-nav">
      <h4>{itl.terms.systems}</h4>

      {systemTypes.map((systemType) => (
        <System
          key={systemType.modelicaPath}
          systemType={systemType}
          templates={getTemplatesForSystem(systemType)}
          meta={meta}
        />
      ))}
    </div>
  );
};

export default LeftNav;
