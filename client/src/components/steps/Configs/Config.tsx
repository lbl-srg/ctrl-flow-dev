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
    <div className="row">
      <div className="col-xs-11">
        <input
          type="text"
          placeholder="Enter Configuration Name"
          value={config.name}
        />
        <ConfigSlideOut template={template} config={config} />
      </div>
      <div className="col-xs-1">
        <a href="#" onClick={remove}>
          <i className="icon-cross" />
        </a>
      </div>
    </div>
  );
}

export default Config;
