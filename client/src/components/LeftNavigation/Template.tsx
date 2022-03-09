import { SystemTemplate, MetaConfiguration } from "../../store/store";

export interface Template {
  template: SystemTemplate;
  meta: MetaConfiguration[];
}

function Template({ template, meta }: Template) {
  return (
    <li>
      <a key={template.id} href={`#${template.name}-${template.name}`}>
        {template.name}
      </a>

      <ul className="configs">
        {meta.map((m) => (
          <li key={m.tagPrefix}>
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
