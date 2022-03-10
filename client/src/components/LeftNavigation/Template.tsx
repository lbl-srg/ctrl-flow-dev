import { SystemTemplate, MetaConfiguration } from "../../store/store";

export interface Template {
  template: SystemTemplate;
  meta: MetaConfiguration[];
  setActiveTemplate: (template: SystemTemplate) => void;
}

function Template({ template, meta, setActiveTemplate }: Template) {
  return (
    <li>
      <a
        key={template.id}
        onClick={() => setActiveTemplate(template)}
        href={`#${template.name}`}
      >
        {template.name}
      </a>

      <ul className="configs">
        {meta.map((m) => (
          <li key={m.config.name}>
            <a className="grid">
              <div>{`${m.config.name}`}</div>
              <div>{`qty.${m.quantity}`}</div>
            </a>
          </li>
        ))}
      </ul>
    </li>
  );
}

export default Template;
