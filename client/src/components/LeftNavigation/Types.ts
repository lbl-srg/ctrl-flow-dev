import {
  SystemTemplate,
  SystemType,
  MetaConfiguration,
} from "../../store/store";

export interface SystemProps {
  systemType: SystemType;
  templates: SystemTemplate[];
  meta: MetaConfiguration[];
}

export interface SystemTemplateProps {
  template: SystemTemplate;
  systemId: number;
  meta: MetaConfiguration[];
}

export interface IconMap {
  iconClass: string;
  systemName: string;
}
