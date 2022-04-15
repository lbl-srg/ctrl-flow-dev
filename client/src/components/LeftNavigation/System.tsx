import SystemTemplate from "./SystemTemplate";
import { findIcon } from "./icon-mappings";
import { SystemProps } from "./Types";
import { useStore } from "../../store/store";
import { scrollToSelector } from "../../utils/dom-utils";

function System({ systemType, templates, meta }: SystemProps) {
  const {
    openSystemId,
    setOpenSystemId,
    activeSystemId,
    clearNavState,
    setActiveSystemId,
    timeoutScroll,
  } = useStore((state) => state);

  const classes = ["system"];
  const isActive = systemType.id === activeSystemId && templates.length > 0;
  const isOpen = systemType.id === openSystemId && templates.length > 0;

  if (!templates.length) classes.push("empty");
  if (isActive) classes.push("active");
  if (isOpen) classes.push("open");

  const icon = findIcon(systemType.name) || "";

  function setActive() {
    clearNavState();
    setActiveSystemId(systemType.id);
    scrollToSelector(`#system-${systemType.id}`);
    timeoutScroll();
  }

  function toggleOpen() {
    setOpenSystemId(isOpen ? null : systemType.id);
  }

  return (
    <div className={classes.join(" ")}>
      <div className="title-bar">
        <a className="title truncate" onClick={setActive}>
          <i className={icon} />
          {systemType.name}
        </a>

        <i onClick={toggleOpen} className={"toggle icon-down-open"} />
      </div>

      {isOpen && (
        <ul className="templates">
          {templates.map((tpl) => (
            <SystemTemplate
              systemId={systemType.id}
              key={tpl.id}
              template={tpl}
              meta={meta.filter((m) => m.config.template.id === tpl.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default System;
