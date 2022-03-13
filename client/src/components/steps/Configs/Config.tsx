import { ConfigProps } from "./Types";
import { useStore } from "../../../store/store";

function Config({ config }: ConfigProps) {
  const { removeConfig } = useStore((state) => state);

  return (
    <div className="row">
      <div className="col-xs-11">
        <input
          type="text"
          placeholder="Enter Configuration Name"
          value={config.name}
        />
      </div>
      <div className="col-xs-1">
        <a onClick={() => removeConfig(config)}>
          <i className="icon-cross" />
        </a>
      </div>
    </div>
  );
}

export default Config;
