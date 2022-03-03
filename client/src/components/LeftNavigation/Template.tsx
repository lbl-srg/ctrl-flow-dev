import { SystemTemplate, Configuration } from "../../store/store";

export interface Template {
  template: SystemTemplate;
  configs: Configuration[];
}

function Template({ template, configs }: Template) {
  return (
    <li>
      <a key={template.id} href={`#${template.name}-${template.name}`}>
        {template.name}
      </a>
      <ul>
        {configs.map((c) => (
          <li key={c.id}>{c.name}</li>
        ))}
      </ul>
    </li>
  );
}

export default Template;
