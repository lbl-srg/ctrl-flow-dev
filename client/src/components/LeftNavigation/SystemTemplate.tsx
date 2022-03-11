import { SystemTemplateProps } from "./Types";
import { useStore } from "../../store/store";
import { useRef, MouseEvent } from "react";

function Template({ template, meta, systemId }: SystemTemplateProps) {
  const { getActiveTemplate, setActiveTemplate, setActiveSystemId } = useStore(
    (state) => state,
  );
  const active = getActiveTemplate()?.id === template.id;
  const ref = useRef(null);
  const rootClass = active ? "active" : "";

  function selectTemplate(ev: MouseEvent) {
    // prevent default since its a <a> with no valid href
    ev.preventDefault();
    setActiveSystemId(systemId);
    setActiveTemplate(template);
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
