import { useStore } from "../../../store/store";
import itl from "../../../translations";
import Config from "./Config";

function Template({ template }) {
  const { addConfig, configs, setOpenSystemId } = useStore((state) => ({
    ...state,
    configs: state.getConfigs(template, null),
  }));

  function add(ev) {
    ev.preventDefault();
    addConfig(template);
    setOpenSystemId(template.systemType.id);
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
          <Config key={config.id} config={config} template={template} />
        ))}
      </div>

      <a href="#" onClick={add}>
        <i className="icon-plus" />
        {itl.phrases.addConfig}
      </a>
    </article>
  );
}

export default Template;
