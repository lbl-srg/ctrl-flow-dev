# Linkage Schema

Linkage Schema is the intermediate format extracted by the parser from modelica-json to narrowly capture what is necessary to:

1. Render available selections from a template
2. Record selections to be used to write out a completed template in modelica

## Modelica Paths as UUIDs

The parser extracts portions of a template and uses `modelicaPath`s as a unique identifier for that portion of a template. This is leveraging modelica's path system that uses dot access to indicate where to find a given piece of modelica.

For example, this is the path to a MultizoneVAV template:

`Buildings.Templates.AirHandlersFans.MultizoneVAV`

And a path to a parameter within the MutlizoneVAV template:

`Buildings.Templates.AirHandlersFans.MultizoneVAV.supBlo`

Modelica has lots of rules about how to potentially interpret these paths (like supporting relative vs. absolute) but the parser only deals in absolutes.

## Read-only Types

### SystemTypes

System types are categories for templates.

```typescript
export interface SystemTypeInterface {
  description: string; // user facing string
  modelicaPath: string;
}
```

### Templates

Holds meta info about a given template. Templates has a one to many relationship with SystemTypes.

`systemTypes`: this is an in-order hierarchical list of categories. Currently modelica-buildings only has categories one level deep, but we need to support multiple levels.

```typescript
export interface TemplateInterface {
  modelicaPath: string; // unique identifier
  name: string; // user facing string
  systemTypes: string[]; // in-order list of system type modelicaPaths
  options?: string[];
}
```

### Options

TODO: there is an open question about separating option groups and single options as a data type.

```typescript
export interface OptionInterface {
  modelicaPath: string;
  type: string;
  name: string;
  value?: string | boolean | null | number;
  group?: string;
  tab?: string;
  visible?: boolean;
  options?: string[];
  childOptions?: OptionInterface[];
  valueExpression?: any; //{ expression: string; modelicaPath: string };
  enable?: any; // { modelicaPath: string; expression: string };
}
```

### Project

```typescript
export interface ProjectDetailInterface {
  name: string;
  address: string;
  type: string;
  size: number;
  units: string;
  code: string;
  notes: string;
}

export interface ProjectInterface {
  id: string;
  projectDetails: ProjectDetailInterface;
}
```

###
