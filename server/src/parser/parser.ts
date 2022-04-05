import fs from "fs";
import path from "path";

const EXTEND_NAME = "_extend";
const MODELICA_LITERALS = ["String", "Boolean"];

function _unpackType(element: any) {
  if ("component_clause" in element) {
    return element.component_clause.type_specifier;
  } else if ("extends_clause" in element) {
    return element.extends_clause.name;
  }
}

function _unpackDeclaration(element: any) {
  return element.component_clause.component_list.find(
    (c: any) => "declaration" in c,
  ).declaration;
}

function _unpackParamDescription(element: any) {
  const description = element.component_clause.component_list.find(
    (c: any) => "description" in c,
  ).description.description_string;

  return [description.description_string, description.annotation];
}

// An element will eventually do the following:
// class Element {
//   modifications = [];
//   label = "";
//   type = "";

//   constructor(public modelicaPath: string, public rawElement: any) {
//     this.type = _unpackType(rawElement);
//   }

//   get description() {
//     if (this.type in MODELICA_LITERALS) {
//       const [description, annotation] = _unpackParamDescription(
//         this.rawElement,
//       );
//       return description;
//     }
//     // either able to get it directly from raw json OR
//     // store[this.type].getDescription
//   }

//   get annotation() {
//     // store[this.type].getAnnotation
//     return [];
//   }

//   getOption() {
//     /* returns representation of this element in 'Option' format */
//   }
// }

// An entry in the 'Element List'
// can be of type:
// Extends clause
// literal parameter (string, boolean, number(TODO: types?), enum)
// record
// replacable (another model, with choices for other models)
// component (another model)

// export const constructElement = (el: any, modelicaRoot: string) => {
//   const element: Partial<Element> = {};
//   if ("component_clause" in el) {
//     const declarationBlock = _unpackDeclaration(el);
//     const name = declarationBlock.identifier;
//     // TODO: modifications can be in many places, we have to
//     // be able to associate where the modification is for when the
//     // template is written
//     const modifications =
//       declarationBlock.modification?.class_modification || [];
//     const modelicaPath = `${modelicaRoot}.${name}`;
//     return new Element(modelicaPath, el);
//   } else if ("extends_clause" in el) {
//     const extends_clause = el.extends_clause;
//     element.type = extends_clause.name;
//     element.modelicaPath = `${modelicaRoot}.${EXTEND_NAME}`;
//     element.modifications = extends_clause.class_modification || [];
//   }

//   return element;
// };

class Element {
  modelicaPath: string = "";
  name: string = "";
}

class Record extends Element {
  elementList: any[];
  description: string;
  constructor(classDefinition: any, basePath: string) {
    super();
    const specifier = classDefinition.class_specifier.long_class_specifier;
    this.name = specifier.identifer;
    this.modelicaPath = `${basePath}.${this.name}`;
    this.description = specifier.description_string;
    this.elementList = specifier.composition.element_list;
  }
}

class Package extends Element {
  elementList: any[];
  description: string;

  constructor(classDefinition: any, basePath: string) {
    super();
    const specifier = classDefinition.class_specifier.long_class_specifier;
    this.name = specifier.identifer;
    this.modelicaPath = `${basePath}.${this.name}`;
    this.description = specifier.description_string;
    this.elementList = specifier.composition.element_list;
  }
}

class Model extends Element {
  elementList: any;
  description: string;

  constructor(classDefinition: any, basePath: string) {
    super();
    const specifier = classDefinition.class_specifier.long_class_specifier;
    this.name = specifier.identifier;
    this.modelicaPath = `${basePath}.${this.name}`;
    this.description = specifier.description_string;
    this.elementList = specifier.composition.element_list; // TODO - could parse this but not now
  }
}

class Enum extends Element {
  enumList: any = [];
  description: string = "";

  constructor(classDefinition: any, basePath: string) {
    super();
    const specifier = classDefinition.class_specifier.short_class_specifier;
    this.name = specifier.identifier;
    this.modelicaPath = `${basePath}.${this.name}`;
    this.enumList = specifier.value.enum_list;
    this.description = specifier.value.description.description_string;
  }
}

// works with 'class_definition'
function _constructElement(
  classDefinition: any,
  basePath: string,
): Element | undefined {
  const classPrefix = classDefinition.class_prefixes;

  switch (classPrefix) {
    case "type":
      return new Enum(classDefinition, basePath);
    case "model":
      return new Model(classDefinition, basePath);
    case "package":
      return new Package(classDefinition, basePath);
    case "record":
      return new Record(classDefinition, basePath);
  }
}

// TODO: need something that works with 'extends_clause'

// TODO: need something that works with 'component_clause'

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
  // const models: Model[] = [];
  // template.class_definition.map((cd: any) => {
  //   if (cd.class_prefixes === "model") {
  //     const name = cd.class_specifier.long_class_specifier.identifier as string;
  //     const modelicaPath = `${template.within}.${cd.class_specifier.long_class_specifier.identifier}`;
  //     const elementListAll =
  //       cd.class_specifier.long_class_specifier.composition.element_list;
  //     const elementList = elementListAll.map((el: any) =>
  //       constructElement(el, modelicaPath),
  //     ) as Element[];
  //     models.push({ name, elementList, modelicaPath });
  //   } else if (cd.class_prefixes === "package") {
  //     // TODO: handle package files as expected
  //     // Could just be the package definition,
  //     // or a single file package that also contains
  //     // multiple model definitions within
  //   }
  // });

  // return models;
};
