import { useStore } from "../../store/store";
import System from "./System";
import itl from "../../translations";

import "../../styles/components/left-navigation.scss";

const LeftNav = () => {
  const { systemTypes, meta, templates } = useStore((state) => ({
    ...state,
    meta: state.getMetaConfigs(),
    templates: state.getActiveTemplates(),
  }));

  return (
    <div className="left-nav">
      <h4>{itl.terms.systems}</h4>

      {systemTypes.map((systemType) => (
        <System
          key={systemType.id}
          systemType={systemType}
          templates={templates.filter(
            (tpl) => tpl.systemType.id === systemType.id,
          )}
          meta={meta}
        />
      ))}
    </div>
  );
};

export default LeftNav;
