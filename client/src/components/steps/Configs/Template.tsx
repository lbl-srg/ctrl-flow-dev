import { MouseEvent } from "react";
import { useStore } from "../../../store/store";
import { TemplateProps } from "./Types";
import { sortByName } from "../../../utils/utils";
import Config from "./Config";

function Template({ template }: TemplateProps) {
  const { addConfig, configs } = useStore((state) => ({
    ...state,
    configs: state.getConfigs(template).sort(sortByName).reverse(),
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
