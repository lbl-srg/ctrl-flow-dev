export interface ConfigValues {
  [key: string]: string; // TODO: make payload shape
}

export interface ConfigInterface {
  id: string;
  name?: string;
  isLocked: boolean;
  selections?: ConfigValues;
  evaluatedValues?: ConfigValues;
  quantity?: number;
  systemPath: string;
  templatePath: string;
  [key: string]: string | number | undefined | boolean | ConfigValues;
}

export type Literal = boolean | string | number;

export type Expression = {
  operator: string;
  operands: Array<Literal | Expression>;
};

export type Modifiers = {
  [key: string]: { expression: Expression; final: boolean; redeclare: boolean };
};

export interface TemplateInterface {
  modelicaPath: string;
  name: string;
  systemTypes: string[];
  options?: string[];
  pathModifiers?: { [key: string]: string | undefined };
}

export interface OptionInterface {
  modelicaPath: string;
  type: string;
  name: string;
  value?: string | boolean | null | number | Expression;
  group?: string;
  tab?: string;
  visible?: boolean;
  options?: string[];
  childOptions?: OptionInterface[];
  valueExpression?: any; //{ expression: string; modelicaPath: string };
  enable?: any; // { modelicaPath: string; expression: string };
  modifiers: any;
  choiceModifiers?: { [key: string]: Modifiers };
  treeList: string[];
  definition: boolean;
  shortExclType: boolean; // Short class definition excluding `type` definition
  replaceable: boolean;
}

export interface SystemTypeInterface {
  description: string;
  modelicaPath: string;
}

export interface TemplateDataInterface {
  templates: TemplateInterface[];
  options: OptionInterface[];
  systemTypes: SystemTypeInterface[];
}
