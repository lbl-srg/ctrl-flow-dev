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
    <div data-spy="template" id={`template-${template.id}`}>
      <div>
        <div>{template.name}</div>
        {/* <UploadDownload path=""></UploadDownload> */}
      </div>

      <div>Configuration(s):</div>

      {configs.map((config) => (
        <Config key={config.id} config={config} template={template} />
      ))}

      <a href="#" onClick={add}>
        <i className="icon-plus" />
        Add Configuration
      </a>
    </div>
  );
}

export default Template;
