import { scrollToSelector } from "../../utils/dom-utils";
import { observer } from "mobx-react";
import { useStores } from "../../data";

const Template = observer(({ templatePath, meta, systemTypePath }) => {
  const { uiStore, templateStore } = useStores();

  const template = templateStore.getTemplateByPath(templatePath);
  const active = uiStore.activeTemplate === templatePath;
  const rootClass = active ? "active" : "";

  function selectTemplate(ev) {
    // prevent default since its a <a> with no valid href
    ev.preventDefault();
    uiStore.setActiveSystemPath(systemTypePath);
    uiStore.setActiveTemplatePath(templatePath);
    scrollToSelector(`#template-${templatePath}`);
  }

  function chooseConfig(configId, ev) {
    ev.preventDefault();
    uiStore.setActiveSystemPath(systemTypePath);
    uiStore.setActiveTemplatePath(template.modelicaPath);
    uiStore.setActiveConfigId(configId);
    scrollToSelector(`#config-${configId}`);
  }

  return (
    <li className={rootClass}>
      <a className="truncate" href="#" onClick={selectTemplate}>
        {template.name}
      </a>

      <ul className="configs">
        {meta.map((m) => (
          <li key={m.config.name}>
            <a
              href="#"
              className={
                m.config.id === uiStore.activeConfigId ? "grid active" : "grid"
              }
              onClick={() => chooseConfig(m.config.id)}
            >
              <div className="truncate">{`${m.config.name}`}</div>
              <div>{`qty.${m.quantity}`}</div>
            </a>
          </li>
        ))}
      </ul>
    </li>
  );
});

export default Template;
