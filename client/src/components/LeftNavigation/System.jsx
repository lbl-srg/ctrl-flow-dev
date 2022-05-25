import SystemTemplate from "./SystemTemplate";
import { findIcon } from "./icon-mappings";
import { scrollToSelector } from "../../utils/dom-utils";
import { useStores } from "../../data";
import { observer } from "mobx-react";

const System = observer(({ systemTypePath, templates, meta }) => {
  const { uiStore, templateStore } = useStores();
  const systemType = templateStore.getSystemTypeByPath(systemTypePath);

  const classes = ["system"];
  const isActive =
    systemTypePath === uiStore.activeSystemPath && templates.length;
  const isOpen = systemTypePath === uiStore.openSystemPath && templates.length;

  if (!templates.length) classes.push("empty");
  if (isActive) classes.push("active");
  if (isOpen) classes.push("open");

  const icon = findIcon(systemType.description) || "";

  function setActive() {
    uiStore.setActiveSystemPath(systemTypePath);
    scrollToSelector(`#system-${systemTypePath}`);
  }

  return (
    <div className={classes.join(" ")}>
      <div className="title-bar">
        <a className="title truncate" onClick={setActive}>
          <i className={icon} />
          {systemType.description}
        </a>

        <i
          onClick={() => uiStore.toggleSystemOpenPath(systemTypePath)}
          className={"toggle icon-down-open"}
        />
      </div>

      {isOpen && (
        <ul className="templates">
          {templates.map((tpl) => (
            <SystemTemplate
              systemTypePath={systemTypePath}
              key={tpl.modelicaPath}
              templatePath={tpl.modelicaPath}
              meta={meta.filter(
                (m) => m.config.template.modelicaPath === tpl.modelicaPath,
              )}
            />
          ))}
        </ul>
      )}
    </div>
  );
});

export default System;
