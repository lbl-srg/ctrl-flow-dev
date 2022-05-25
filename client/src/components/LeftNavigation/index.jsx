import { useStore } from "../../store/store";
import System from "./System";
import itl from "../../translations";
import { useStores } from "../../data";

import "../../styles/components/left-navigation.scss";

const LeftNav = () => {
  // TODO: what is this meta and wehre does it come from
  const { meta } = useStore((state) => ({
    meta: state.getMetaConfigs(),
  }));

  const { templateStore } = useStores();

  return (
    <div className="left-nav">
      <h4>{itl.terms.systems}</h4>

      {templateStore.systemTypes.map((systemType) => (
        <System
          key={systemType.modelicaPath}
          systemTypePath={systemType.modelicaPath}
          templates={templateStore.getTemplatesForSystem(
            systemType.modelicaPath,
          )}
          meta={meta}
        />
      ))}
    </div>
  );
};

export default LeftNav;
