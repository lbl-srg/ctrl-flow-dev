import SystemTemplate from "./SystemTemplate";
import { findIcon } from "./icon-mappings";
import { useStore } from "../../store/store";
import { scrollToSelector } from "../../utils/dom-utils";

function System({ systemType, templates, meta }) {
  const {
    openSystemPath,
    setOpenSystemPath,
    activeSystemPath,
    clearNavState,
    setActiveSystemPath,
    timeoutScroll,
  } = useStore((state) => state);

  const classes = ["system"];
  const isActive =
    systemType.modelicaPath === activeSystemPath && templates.length > 0;
  const isOpen =
    systemType.modelicaPath === openSystemPath && templates.length > 0;

  if (!templates.length) classes.push("empty");
  if (isActive) classes.push("active");
  if (isOpen) classes.push("open");

  const icon = findIcon(systemType.description) || "";

  function setActive() {
    clearNavState();
    setActiveSystemPath(systemType.modelicaPath);
    scrollToSelector(`#system-${systemType.modelicaPath}`);
    timeoutScroll();
  }

  function toggleOpen() {
    setOpenSystemPath(isOpen ? null : systemType.modelicaPath);
  }

  return (
    <div className={classes.join(" ")}>
      <div className="title-bar">
        <a className="title truncate" onClick={setActive}>
          <i className={icon} />
          {systemType.description}
        </a>

        <i onClick={toggleOpen} className={"toggle icon-down-open"} />
      </div>

      {isOpen && (
        <ul className="templates">
          {templates.map((tpl) => (
            <SystemTemplate
              systemPath={systemType.modelicaPath}
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
}

export default System;
