import { Configuration, UserSystem } from "../../../store/store";

export interface SystemWidgetForm {
  tag: string;
  start: number;
  quantity: number;
  configID: number;
}

export interface AddUserSystemsWidgetProps {
  configs: Configuration[];
}

export interface UserSystemTableProps {
  userSystems: UserSystem[];
}

export interface UserSystemRowProps {
  userSystem: UserSystem;
}

export type AddUserSystemsAction = (
  tag: string,
  start: number,
  quantity: number,
  config: Configuration,
) => void;
