import { scrollToSelector } from "../../utils/dom-utils";
import { useStores } from "../../data";
import { observer } from "mobx-react";

const SystemTemplate = observer(({ systemPath, templatePath }) => {
  const { uiStore, templateStore, configStore } = useStores();

  const template = templateStore.getTemplateByPath(templatePath);
  const configs = configStore.getConfigsForSystemTemplate(
    systemPath,
    templatePath,
  );
  const active = uiStore.activeTemplate === templatePath;
  const rootClass = active ? "active" : "";

  function selectTemplate(ev) {
    // prevent default since its a <a> with no valid href
    ev.preventDefault();
    uiStore.setActiveSystemPath(systemPath);
    uiStore.setActiveTemplatePath(templatePath);
    scrollToSelector(`#template-${templatePath}`);
  }

  function chooseConfig(configId, ev) {
    ev.preventDefault();
    uiStore.setActiveSystemPath(systemPath);
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
        {configs.map((config) => (
          <li key={config.id}>
            <a
              href="#"
              className={
                config.id === uiStore.activeConfigId ? "grid active" : "grid"
              }
              onClick={(ev) => chooseConfig(config.id, ev)}
            >
              <div className="truncate">{config.name}</div>
              <div>{`qty.${config.quantity}`}</div>
            </a>
          </li>
        ))}
      </ul>
    </li>
  );
});

export default SystemTemplate;
