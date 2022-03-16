import { Configuration, UserSystem } from "../../../store/store";

export interface SystemWidgetForm {
  tag: string;
  start: number;
  quantity: number;
  configID: number;
}

export interface GroupedField {
  groupName: string;
  fields: string[];
}
export interface AddUserSystemsWidgetProps {
  configs: Configuration[];
}

export interface UserSystemTableProps {
  userSystems: UserSystem[];
}

export interface UserSystemRowProps {
  userSystem: UserSystem;
  index: number;
  groups: GroupedField[];
}

export type AddUserSystemFormData = {
  tag: string;
  start: string;
  quantity: string;
  configId: string;
};

export type AddUserSystemsAction = (
  tag: string,
  start: number,
  quantity: number,
  config: Configuration,
) => void;
