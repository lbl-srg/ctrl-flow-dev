import SystemTemplate from "./SystemTemplate";
import { findIcon } from "./icon-mappings";
import { scrollToSelector } from "../../utils/dom-utils";
import { getSystemTypeByPath } from "../../utils/TemplateHelpers";
import { useStores } from "../../data";
import { observer } from "mobx-react";

const System = observer(({ systemTypePath, templates, meta }) => {
  const { uiStore } = useStores();
  const systemType = getSystemTypeByPath(systemTypePath);

  const classes = ["system"];
  const isActive = systemTypePath === uiStore.activeSystem && templates.length;
  const isOpen = systemTypePath === uiStore.openSystem && templates.length;

  if (!templates.length) classes.push("empty");
  if (isActive) classes.push("active");
  if (isOpen) classes.push("open");

  const icon = findIcon(systemType.description) || "";

  function setActive() {
    uiStore.setActiveSystem(systemTypePath);
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
          onClick={() => uiStore.toggleSystemOpen(systemTypePath)}
          className={"toggle icon-down-open"}
        />
      </div>

      {isOpen && (
        <ul className="templates">
          {templates.map((tpl) => (
            <SystemTemplate
              systemTypePath={systemTypePath}
              key={tpl.modelicaPath}
              template={tpl}
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
