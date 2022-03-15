import { SystemTemplateProps } from "./Types";
import { useStore } from "../../store/store";
import { useRef, MouseEvent } from "react";
import { scrollToSelector } from "../../utils/dom-utils";

function Template({ template, meta, systemId }: SystemTemplateProps) {
  const {
    activeTemplateId,
    setActiveTemplateId,
    setActiveSystemId,
    timeoutScroll,
    setActiveConfigId,
    activeConfigId,
    clearNavState,
  } = useStore((state) => state);

  const active = activeTemplateId === template.id;

  const ref = useRef(null);
  const rootClass = active ? "active" : "";

  function selectTemplate(ev: MouseEvent) {
    // prevent default since its a <a> with no valid href
    ev.preventDefault();
    clearNavState();
    setActiveSystemId(systemId);
    setActiveTemplateId(template.id);
    timeoutScroll();
    scrollToSelector(`#template-${template.id}`);
  }

  function chooseConfig(configId: number, ev: MouseEvent) {
    ev.preventDefault();
    clearNavState();
    setActiveSystemId(systemId);
    setActiveTemplateId(template.id);
    setActiveConfigId(configId);
    timeoutScroll();
    scrollToSelector(`#config-${configId}`);
  }

  return (
    <li ref={ref} className={rootClass}>
      <a
        className="truncate"
        key={template.id}
        href="#"
        onClick={selectTemplate}
      >
        {template.name}
      </a>

      <ul className="configs">
        {meta.map((m) => (
          <li key={m.config.name}>
            <a
              href="#"
              className={
                m.config.id === activeConfigId ? "grid active" : "grid"
              }
              onClick={chooseConfig.bind(null, m.config.id)}
            >
              <div className="truncate">{`${m.config.name}`}</div>
              <div>{`qty.${m.quantity}`}</div>
            </a>
          </li>
        ))}
      </ul>
    </li>
  );
}

export default Template;
