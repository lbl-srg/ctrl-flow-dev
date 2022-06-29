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

Holds meta info about a given template. Templates have a one to many relationship with SystemTypes.
`modelicaPath`: the UUID for the template, as well as the identifier for the entrypoint option in the options table.

`systemTypes`: this is an in-order hierarchical list of categories. Currently modelica-buildings only has categories one level deep, but we need to support multiple levels.

`options`: This is a flat list of all available options in the template.

```typescript
export interface TemplateInterface {
  modelicaPath: string; // unique identifier
  name: string; // user facing string
  systemTypes: string[]; // in-order list of system type modelicaPaths
}
```

### Options

An option represents a 'node' of info from the template that _could_ be rendered into visible UI in the front-end.

`visible`: Options are a modal data structure that can behave in two ways:

1. If `visible` is true, it will be rendered with childOptions rendered in a dropdown list
2. If `visible` is false, attempt to render each childOption.

`type`: a modelica path to a specific type OR a primitive type ('String', 'Number', 'Boolean')
`value`: If a default value is assigned in the template it is represented here. This assignment will have the same type as 'type'.
`valueExpression`: Default values can be assigned by expression (e.g. `if param is > 5 true else false`).
`enable`: An expression to determine whether or not an option is enabled.

NOTE: expression integration is ongoing so `valueExpression` and `enable` are always null. When the parser starts extacting expressions it will do so in a TBD `Expression` format used for both `valueExpression` and `enable`.

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
  valueExpression?: any; //
  enable?: any; // { modelicaPath: string; expression: string };
}
```

Options have a recursive structure with options having options. To traverse the entire list of options for a given template:

1. Lookup the entrypoint option of a template by finding the matching modelica path
2. For each childOption, visit that option and each of it's childOptions

TODO: there is an open question about separating option groups and single options as a data type.

### Expression - TBD

### Schedule Table reorganization

## Write Data - User Configurations

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

### Configurations

### Selections
