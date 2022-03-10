import {
  useStore,
  Configuration,
  UserSystem,
  SystemTemplate,
} from "../../../store/store";

export interface SystemWidgetForm {
  tag: string;
  start: number;
  quantity: number;
  configID: number;
}

export interface AddUserSystemsWidgetProps {
  configs: Configuration[];
}

export interface UserSystemsProps {
  userSystems: UserSystem[];
}

export type AddUserSystemsAction = (
  tag: string,
  start: number,
  quantity: number,
  config: Configuration,
) => void;
