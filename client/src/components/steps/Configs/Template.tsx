import { MouseEvent } from "react";
import { useStore } from "../../../store/store";
import { TemplateProps } from "./Types";
import Config from "./Config";

function Template({ template, configs }: TemplateProps) {
  const { addConfig } = useStore((state) => ({
    ...state,
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
      <h4>
        {template.name}
        {/* <UploadDownload path=""></UploadDownload> */}
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
