import { MouseEvent } from "react";
import { ConfigProps } from "./Types";
import { useStore } from "../../../store/store";
import ConfigSlideOut from "../../modal/ConfigSlideOut";

function Config({ config, template }: ConfigProps) {
  const { removeConfig } = useStore((state) => state);

  function remove(ev: MouseEvent) {
    ev.preventDefault();
    removeConfig(config);
  }

  return (
    <div className="config">
      <div className="input-container">
        <input
          type="text"
          placeholder="Enter Configuration Name"
          value={config.name}
        />

        <div className="config-actions">
          <ConfigSlideOut template={template} config={config} />
        </div>
      </div>

      <a href="#" className="remove" onClick={remove}>
        <i className="icon-cross" />
      </a>
    </div>
  );
}

export default Config;
