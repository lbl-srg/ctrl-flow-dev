import { useStore } from "../../store/store";
import System from "./System";

import "../../styles/components/left-navigation.scss";

const LeftNav = () => {
  const { systemTypes, meta, getActiveTemplates } = useStore((state) => ({
    meta: state.getMetaConfigs(),
    systemTypes: state.systemTypes,
    getActiveTemplates: state.getActiveTemplates,
  }));

  const templates = getActiveTemplates();

  return (
    <div className="left-nav">
      <h4>Systems</h4>

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
