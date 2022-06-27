import SystemTemplate from "./SystemTemplate";
import { scrollToSelector } from "../../utils/dom-utils";
import { useStores } from "../../data";
import { observer } from "mobx-react";
import { TemplateInterface } from "../../data/template";

function getClasses(isEmpty: boolean, isActive: boolean, isOpen: boolean) {
  const classes = ["system"];
  if (isEmpty) classes.push("empty");
  else {
    if (isActive) classes.push("active");
    if (isOpen) classes.push("open");
  }

  return classes;
}

const System = observer(({ systemPath }: { systemPath: string }) => {
  const { uiStore, templateStore } = useStores();

  const { systemType, templates, icon } = {
    templates: templateStore.getActiveTemplatesForSystem(systemPath),
    systemType: templateStore.getSystemTypeByPath(systemPath),
    icon: templateStore.getIconForSystem(systemPath),
  };

  const isEmpty = !templates.length;
  const isActive = systemPath === uiStore.activeSystemPath && !isEmpty;
  const isOpen = systemPath === uiStore.openSystemPath && !isEmpty;

  const classes = getClasses(isEmpty, isActive, isOpen);

  if (isEmpty) classes.push("empty");
  else {
    if (isActive) classes.push("active");
    if (isOpen) classes.push("open");
  }

  function setActive() {
    uiStore.setActiveSystemPath(systemPath);
    scrollToSelector(`#system-${systemPath}`);
  }

  return (
    <div className={classes.join(" ")}>
      <div className="title-bar">
        <a className="title truncate" onClick={setActive}>
          <i className={icon} />
          {systemType.description}
        </a>

        <i
          onClick={() => uiStore.toggleSystemOpenPath(systemPath)}
          className={"toggle icon-down-open"}
        />
      </div>

      {isOpen && !isEmpty && (
        <ul className="templates">
          {templates.map((tpl: TemplateInterface) => (
            <SystemTemplate
              key={tpl.modelicaPath}
              systemPath={systemPath}
              templatePath={tpl.modelicaPath}
            />
          ))}
        </ul>
      )}
    </div>
  );
});

export default System;
