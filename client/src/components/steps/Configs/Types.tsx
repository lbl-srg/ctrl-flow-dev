import {
  Configuration,
  SystemTemplate,
  SystemType,
} from "../../../store/store";

export interface ConfigProps {
  config: Configuration;
  template: SystemTemplate;
  removeConfig: (config: Configuration) => void;
}

export interface SystemTypeProps {
  systemType: SystemType;
}
