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
  } = useStore((state) => state);

  const active = activeTemplateId === template.id;

  const ref = useRef(null);
  const rootClass = active ? "active" : "";

  function selectTemplate(ev: MouseEvent) {
    // prevent default since its a <a> with no valid href
    ev.preventDefault();
    setActiveSystemId(systemId);
    setActiveTemplateId(template.id);
    timeoutScroll();
    scrollToSelector(`#template-${template.id}`);
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
            <a className="grid template">
              <span>{`${m.config.name}`}</span>
              <span>{`qty.${m.quantity}`}</span>
            </a>
          </li>
        ))}
      </ul>
    </li>
  );
}

export default Template;
