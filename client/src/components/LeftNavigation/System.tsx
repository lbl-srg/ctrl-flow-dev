import SystemTemplate from "./SystemTemplate";
import { findIcon } from "./icon-mappings";
import { SystemProps } from "./Types";
import { useStore } from "../../store/store";
import { scrollToSelector } from "../../utils/dom-utils";
import { useState } from "react";

function System({ systemType, templates, meta }: SystemProps) {
  const { activeSystemId, setActiveSystemId, timeoutScroll } = useStore(
    (state) => state,
  );

  const classes = ["system"];
  const isActive = systemType.id === activeSystemId;
  const [isOpen, setIsOpen] = useState(isActive);

  if (!templates.length) classes.push("empty");
  if (isActive) classes.push("active");
  if (isOpen) classes.push("open");

  const icon = findIcon(systemType.name) || "";

  function setActive() {
    setActiveSystemId(systemType.id);
    scrollToSelector(`#system-${systemType.id}`);
    setIsOpen(true);
    timeoutScroll();
  }

  return (
    <div className={classes.join(" ")}>
      <div className="title-bar">
        <a className="title truncate" onClick={setActive}>
          <i className={icon} />
          {systemType.name}
        </a>

        <i
          onClick={() => setIsOpen(!isOpen)}
          className={"toggle icon-down-open"}
        />
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
