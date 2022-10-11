import { ConfigInterface } from "../../../data/config";
export interface SystemWidgetForm {
  tag: string;
  start: number;
  quantity: number;
  configID: number;
}

export interface GroupedFields {
  groupName: string;
  fields: string[];
}

export interface UserSystemTableProps {
  scheduleOptions: any;
}

export interface UserSystemRowProps {
  scheduleOptions: any;
  groups: GroupedFields[];
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
  config: ConfigInterface,
) => void;
