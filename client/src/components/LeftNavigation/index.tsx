import System from "./System";
import itl from "../../translations";
import { useStores } from "../../data";

import "../../styles/components/left-navigation.scss";
import { SystemTypeInterface } from "../../data/types";

const LeftNav = () => {
  const { templateStore } = useStores();

  return (
    <div className="left-nav">
      <h4>{itl.terms.systems}</h4>

      {templateStore.systemTypes.map((systemType: SystemTypeInterface) => (
        <System
          key={systemType.modelicaPath}
          systemPath={systemType.modelicaPath}
        />
      ))}
    </div>
  );
};

export default LeftNav;
