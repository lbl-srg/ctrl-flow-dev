import fs from "fs";
import path from "path";

const EXTEND_NAME = "__extend";
const MODELICA_LITERALS = ["String", "Boolean"];

const store: { [key: string]: any } = {};

export class Element {
  modelicaPath = "";
  name = "";
}

export class Record extends Element {
  elementList: any[];
  description: string;
  constructor(definition: any, basePath: string) {
    super();
    const specifier = definition.class_specifier.long_class_specifier;
    this.name = specifier.identifer;
    this.modelicaPath = `${basePath}.${this.name}`;
    this.description = specifier.description_string;
    this.elementList = specifier.composition.element_list;
    store[this.modelicaPath] = this;
  }
}

export class Package extends Element {
  elementList: any[];
  description: string;

  constructor(definition: any, basePath: string) {
    super();
    const specifier = definition.class_specifier.long_class_specifier;
    this.name = specifier.identifer;
    this.modelicaPath = `${basePath}.${this.name}`;
    this.description = specifier.description_string;
    this.elementList = specifier.composition.element_list;
  }
}

export class Model extends Element {
  elementList: any;
  description: string;

  constructor(definition: any, basePath: string) {
    super();
    const specifier = definition.class_specifier.long_class_specifier;
    this.name = specifier.identifier;
    this.modelicaPath = `${basePath}.${this.name}`;
    this.description = specifier.description_string;
    this.elementList = specifier.composition.element_list.map((e: any) =>
      _constructElement(e, basePath),
    );
    store[this.modelicaPath] = this;
  }

  getOptions() {
    const optionList: any[] = [];

    this.elementList.map((el: any) => {
      const type = el.type; // TODO: may not have a type!
      if (type in MODELICA_LITERALS) {
        // or maybe we manually make modelica literal types and add to store?
      } else {
        const instance = store[type];
        optionList.push(...el.getOptions());
      }
    });

    return optionList;
  }
}

// a parameter with a type
export class Component extends Element {
  modifications: any[] = [];
  type = ""; // modelica path
  value: any; // TODO
  description = "";
  annotation: any; // TODO

  constructor(definition: any, basePath: string) {
    super();
    const componentClause = definition.component_clause;
    const declarationBlock = componentClause.component_list.find(
      (c: any) => "declaration" in c,
    ).declaration;
    this.name = declarationBlock.identifier;
    this.modelicaPath = `${basePath}.${this.name}`;

    this.type = componentClause.type_specifier;
    const descriptionBlock = componentClause.component_list.find(
      (c: any) => "description" in c,
    )?.description;

    if (descriptionBlock) {
      this.description = descriptionBlock?.description_string || "";
      this.annotation = descriptionBlock?.annotation;
    }
    store[this.modelicaPath] = this;
  }
}

export class Enum extends Element {
  enumList: any = [];
  description: string = "";

  constructor(definition: any, basePath: string) {
    super();
    const specifier = definition.class_specifier.short_class_specifier;
    this.name = specifier.identifier;
    this.modelicaPath = `${basePath}.${this.name}`;
    this.enumList = specifier.value.enum_list;
    this.description = specifier.value.description.description_string;
    store[this.modelicaPath] = this;
  }
}

export class ExtendClause extends Element {
  modifications: any[] = [];
  type: string; // modelica path
  constructor(definition: any, basePath: string) {
    super();
    this.name = "__extend"; // arbitrary name. Important that this will not collide with other param names
    this.modelicaPath = `${basePath}.${definition.extends_clause.name}`;
    this.type = definition.extends_clause.name;
    store[this.modelicaPath] = this;
  }
}

/**
 * Given a list of elements, discovers and returns the formatted type
 *
 * @param definition
 * @param basePath
 * @returns
 */
function _constructElement(
  definition: any,
  basePath: string,
): Element | undefined {
  const extend = "extends_clause";
  const component = "component_clause";

  // either the element type is defined ('type', 'model', 'package', or 'record') or
  // 'extend_clause' or 'component_clause' is provided
  let elementType = null;
  if ("class_prefixes" in definition) {
    elementType = definition.class_prefixes;
  } else if (extend in definition) {
    elementType = extend;
  } else if (component in definition) {
    elementType = component;
  }

  switch (elementType) {
    case "type":
      return new Enum(definition, basePath);
    case "model":
      return new Model(definition, basePath);
    case "package":
      return new Package(definition, basePath);
    case "record":
      return new Record(definition, basePath);
    case extend:
      return new ExtendClause(definition, basePath);
    case component:
      return new Component(definition, basePath);
  }
}

//
export class File {
  public modelicaPath = ""; // only important part of a file
  public entries: any[] = [];
  constructor(obj: any) {
    this.modelicaPath = obj.within;
    obj.class_definition.map((cd: any) => {
      this.entries.push(_constructElement(cd, this.modelicaPath));
    });
  }
}

// Extracts models/packages
export const getFile = (filePath: string) => {
  const templateString = fs.readFileSync(filePath, { encoding: "utf8" });

  return new File(JSON.parse(templateString));
};
