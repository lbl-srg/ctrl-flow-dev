import { MouseEvent } from "react";
import { useStore } from "../../../store/store";
import { TemplateProps } from "./Types";
import Config from "./Config";

function Template({ template }: TemplateProps) {
  const { addConfig, configs } = useStore((state) => ({
    ...state,
    configs: state.getConfigs(template, null),
  }));

  function add(ev: MouseEvent) {
    ev.preventDefault();
    addConfig(template);
  }

  return (
    <article
      className="template"
      data-spy="template"
      id={`template-${template.id}`}
    >
      <h4 className="with-links">
        {template.name}
        <div className="links">
          <a>
            <i className="icon-upload" />
            Upload
          </a>
          <a>
            <i className="icon-download" />
            Download
          </a>
        </div>
      </h4>

      <strong className="uppercase">Configuration(s):</strong>

      <div className="config-container">
        {configs.map((config) => (
          <Config key={config.id} config={config} template={template} />
        ))}
      </div>

      <a href="#" onClick={add}>
        <i className="icon-plus" />
        Add Configuration
      </a>
    </article>
  );
}

export default Template;
