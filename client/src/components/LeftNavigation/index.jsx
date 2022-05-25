import { useStore } from "../../store/store";
import System from "./System";
import itl from "../../translations";

import "../../styles/components/left-navigation.scss";

import {
  systemTypes,
  getTemplatesForSystem,
} from "../../utils/TemplateHelpers";

const LeftNav = () => {
  const { meta } = useStore((state) => ({
    meta: state.getMetaConfigs(),
  }));

  return (
    <div className="left-nav">
      <h4>{itl.terms.systems}</h4>

      {systemTypes.map((systemType) => (
        <System
          key={systemType.modelicaPath}
          systemTypePath={systemType.modelicaPath}
          templates={getTemplatesForSystem(systemType)}
          meta={meta}
        />
      ))}
    </div>
  );
};

export default LeftNav;
