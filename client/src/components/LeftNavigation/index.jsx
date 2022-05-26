import System from "./System";
import itl from "../../translations";
import { useStores } from "../../data";

import "../../styles/components/left-navigation.scss";

const LeftNav = () => {
  const { templateStore } = useStores();

  return (
    <div className="left-nav">
      <h4>{itl.terms.systems}</h4>

      {templateStore.systemTypes.map((systemType) => (
        <System
          key={systemType.modelicaPath}
          systemPath={systemType.modelicaPath}
        />
      ))}
    </div>
  );
};

export default LeftNav;
