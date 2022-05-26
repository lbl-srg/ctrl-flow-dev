import itl from "../../../translations";
import Config from "./Config";
import { useStores } from "../../../data";
import { observer } from "mobx-react";

const Template = ({ systemPath, templatePath }) => {
  const { templateStore, configStore, uiStore } = useStores();

  const configs = configStore.getConfigsForSystemTemplate(
    systemPath,
    templatePath,
  );
  const { template } = {
    template: templateStore.getTemplateByPath(templatePath),
  };

  function add(ev) {
    ev.preventDefault();
    configStore.add({ systemPath, templatePath, name: "untitled" });
    uiStore.setOpenSystemPath(systemPath);
  }

  return (
    <article
      className="template"
      data-spy="template"
      id={`template-${templatePath}`}
    >
      <h4 className="with-links">
        {template.name}
        <div className="links">
          <a>
            <i className="icon-upload" />
            {itl.terms.upload}
          </a>
          <a>
            <i className="icon-download" />
            {itl.terms.download}
          </a>
        </div>
      </h4>

      <strong className="uppercase">Configuration(s):</strong>

      <div className="config-container">
        {configs.map((config) => (
          <Config key={config.id} configId={config.id} />
        ))}
      </div>

      <a href="#" onClick={add}>
        <i className="icon-plus" />
        {itl.phrases.addConfig}
      </a>
    </article>
  );
};

export default Template;
