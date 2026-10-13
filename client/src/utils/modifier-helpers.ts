import type { Expression } from "../interpreter/interpreter";

export interface ConfigValues {
  [key: string]: boolean | string | number | null | undefined;
}

export type Modifiers = {
  [key: string]: {
    expression?: Expression | string;
    final: boolean;
    redeclare?: string;
  };
};
