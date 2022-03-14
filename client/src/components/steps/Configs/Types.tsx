import {
  Configuration,
  SystemTemplate,
  SystemType,
} from "../../../store/store";

export interface SystemProps {
  systemType: SystemType;
  templates: SystemTemplate[];
}

export interface TemplateProps {
  template: SystemTemplate;
}

export interface ConfigProps {
  config: Configuration;
  template: SystemTemplate;
}
