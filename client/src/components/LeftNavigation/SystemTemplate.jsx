import { useStore } from "../../store/store";
import { useRef } from "react";
import { scrollToSelector } from "../../utils/dom-utils";

function Template({ template, meta, systemTypePath }) {
  const {
    activeTemplatePath,
    setActiveTemplatePath,
    setActiveSystemPath,
    timeoutScroll,
    setActiveConfigId,
    activeConfigId,
    clearNavState,
  } = useStore((state) => state);

  const active = activeTemplatePath === template.modelicaPath;
  const ref = useRef(null);
  const rootClass = active ? "active" : "";

  function selectTemplate(ev) {
    // prevent default since its a <a> with no valid href
    ev.preventDefault();
    clearNavState();
    setActiveSystemPath(systemTypePath);
    setActiveTemplatePath(template.modelicaPath);
    timeoutScroll();
    scrollToSelector(`#template-${template.modelicaPath}`);
  }

  function chooseConfig(configId, ev) {
    ev.preventDefault();
    clearNavState();
    setActiveSystemPath(systemTypePath);
    setActiveTemplatePath(template.modelicaPath);
    setActiveConfigId(configId);
    timeoutScroll();
    scrollToSelector(`#config-${configId}`);
  }

  return (
    <li ref={ref} className={rootClass}>
      <a
        className="truncate"
        key={template.modelicaPath}
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
