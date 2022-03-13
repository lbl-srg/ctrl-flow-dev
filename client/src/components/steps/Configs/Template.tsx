import { TemplateProps } from "./Types";
import Config from "./Config";

function Template({ template, configs }: TemplateProps) {
  return (
    <div>
      <div>
        <div>{template.name}</div>
        {/* <UploadDownload path=""></UploadDownload> */}
      </div>
      <div>Configuration(s):</div>

      {configs.map((config) => (
        <Config key={config.id} config={config} />
      ))}
      <a>+ Add Configuration</a>
    </div>
  );
}

export default Template;
