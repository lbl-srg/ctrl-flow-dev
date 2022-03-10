import { useStore } from "../../store/store";
import System from "./System";

import "../../styles/components/left-navigation.scss";

const LeftNav = () => {
  const { systemTypes, meta, getActiveTemplates, setActiveTemplate } = useStore(
    (state) => ({
      meta: state.getMetaConfigs(),
      systemTypes: state.systemTypes,
      getActiveTemplates: state.getActiveTemplates,
      setActiveTemplate: state.setActiveTemplate,
    }),
  );

  const templates = getActiveTemplates();

  return (
    <div className="left-nav">
      <h4>Systems</h4>

      {systemTypes.map((systemType) => (
        <System
          key={systemType.id}
          systemType={systemType}
          templates={templates.filter((t) => t.systemType.id === systemType.id)}
          meta={meta}
          setActiveTemplate={setActiveTemplate}
        />
      ))}
    </div>
  );
};

export default LeftNav;
