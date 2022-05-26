import SystemTemplate from "./SystemTemplate";
import { scrollToSelector } from "../../utils/dom-utils";
import { useStores } from "../../data";
import { observer } from "mobx-react";

const System = observer(({ systemPath }) => {
  const { uiStore, templateStore } = useStores();

  const templates = templateStore.getActiveTemplatesForSystem(systemPath);
  const systemType = templateStore.getSystemTypeByPath(systemPath);
  const icon = templateStore.getIconForSystem(systemPath);

  const classes = ["system"];
  const isActive = systemPath === uiStore.activeSystemPath && templates.length;
  const isOpen = systemPath === uiStore.openSystemPath && templates.length;

  if (!templates.length) classes.push("empty");
  if (isActive) classes.push("active");
  if (isOpen) classes.push("open");

  function setActive() {
    uiStore.setActiveSystemPath(systemPath);
    scrollToSelector(`#system-${systemPath}`);
  }

  return (
    <div className={classes.join(" ")}>
      <div className="title-bar">
        <a className="title truncate" onClick={setActive}>
          <i className={icon} />
          {systemType.description}
        </a>

        <i
          onClick={() => uiStore.toggleSystemOpenPath(systemPath)}
          className={"toggle icon-down-open"}
        />
      </div>

      {isOpen && templates.length && (
        <ul className="templates">
          {templates.map((tpl) => (
            <SystemTemplate
              key={tpl.modelicaPath}
              systemPath={systemPath}
              templatePath={tpl.modelicaPath}
            />
          ))}
        </ul>
      )}
    </div>
  );
});

export default System;
