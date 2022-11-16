import { scrollToSelector } from "../../utils/dom-utils";
import { useStores } from "../../data";
import { observer } from "mobx-react";
import { SyntheticEvent } from "react";
import { ConfigInterface } from "../../data/config";
import { TemplateInterface } from "../../data/template";

const SystemTemplate = observer(
  ({
    systemPath,
    templatePath,
  }: {
    systemPath: string;
    templatePath: string;
  }) => {
    const { uiStore, templateStore, configStore } = useStores();

    const template = templateStore.getTemplateByPath(
      templatePath,
    ) as TemplateInterface;
    const configs = configStore.getConfigsForSystemTemplate(
      systemPath,
      templatePath,
    );
    const active = uiStore.activeTemplate?.modelicaPath === templatePath;
    const rootClass = active ? "active" : "";

    function selectTemplate(ev: SyntheticEvent) {
      // prevent default since its a <a> with no valid href
      ev.preventDefault();
      uiStore.setActiveSystemPath(systemPath);
      uiStore.setActiveTemplatePath(templatePath);
      scrollToSelector(`#template-${templatePath}`);
    }

    function chooseConfig(configId: string | undefined, ev: SyntheticEvent) {
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
          {configs.map((config: ConfigInterface) => (
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
  },
);

export default SystemTemplate;
