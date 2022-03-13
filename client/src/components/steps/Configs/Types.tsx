import {
  Configuration,
  SystemTemplate,
  SystemType,
} from "../../../store/store";

export interface SystemProps {
  systemType: SystemType;
  templates: SystemTemplate[];
  configs: Configuration[];
}

export interface TemplateProps {
  template: SystemTemplate;
  configs: Configuration[];
}

export interface ConfigProps {
  config: Configuration;
  template: SystemTemplate;
}
