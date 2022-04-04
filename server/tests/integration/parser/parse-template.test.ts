import { execSync } from "child_process";
import fs from "fs";
import path from "path";

import config from "../../../src/config";

const tempDirPath = "/tmp/test-linkage-widget";
const templatePath =
  "json/tests/static-data/TestModelicaPackage/Template/TestTemplate.json";

const MODELICA_LITERALS = ["String", "Boolean"]; // TODO: number types

interface Model {
  elementList: any[];
  modelicaPath: string;
  name: string;
}

// element in ElementList
interface Element {
  elementType: "component" | "extends" | "record" | "parameter" | "replaceable";
  path: string; // modelica path
}

interface Extends extends Element {
  classModification: any[];
}

// interface Component extends Element {}

// parameter is for literals
interface Parameter extends Element {
  type: string; // literal type... OR enum link!
}

interface UnknownParameter extends Element {
  element: any;
}

const parseFile = (filePath: string) => {
  const fullPath = path.resolve(tempDirPath, filePath);
  const templateString = fs.readFileSync(fullPath, { encoding: "utf8" });

  return JSON.parse(templateString);
};

const extractParameterDeclaration = (declaration: any) => {};

const createLiteralParameter = (el: any) => {
  const param = { type: el.component_clause.type_specifier };
  const componentList = el.component_clause.component_list;

  const declaration = componentList.declaration;
};

interface Declaration {
  identifier: string;
  modification: any;
}

interface Description {
  description_string: string;
  annotation: any[];
}

interface Component {
  path: string; // modelica path
  component_list: (Declaration | Description)[];
}

// generically have 'components'

// component contents will either be completed (if a literal) or
// need to be resolved

const componentContents = (component: any) => {};

// holds the modelica path (uniqe identifier)
// any modifiers (args)
interface Element {
  modelicaPath: string;
  modifications: any[];
  label: string;
}

const unpackDeclaration = (declaration: any) => {
  return [declaration.name, declaration.modification.class_modification];
};

// First: just focus on setting modelica path correctly
const constructElement = (el: any, modelicaRoot: string) => {
  const element: Partial<Element> = {};
  if ("component_clause" in el) {
    const componentClause = el.component_clause;
    const declarationBlock = componentClause.component_list.find(
      (c: any) => "declaration" in c,
    );
    const name = declarationBlock.identifier;
    element.modifications =
      declarationBlock.modification?.class_modification || [];
    element.modelicaPath =
      componentClause.type_specifier in MODELICA_LITERALS
        ? `${modelicaRoot}.${name}`
        : componentClause.type_specifier;
  } else if ("extends_clause" in el) {
    const extends_clause = el.extends_clause;
    element.modelicaPath = extends_clause.name;
    element.modifications = extends_clause.class_modification || [];
  }

  return element;
};

// converts each element in the element list into its wrapped type
// 'parameter', 'extends', 'record', 'component', 'selectable'
const getModelContents = (model: Model) => {
  model.elementList.map((el) => constructElement(el, model.modelicaPath));
};

// Extracts models/packages
const getFileContents = (template: any) => {
  // const models: { [key: string]: any } = {};
  const models: Model[] = [];
  template.class_definition.map((cd: any) => {
    if (cd.class_prefixes === "model") {
      const name = cd.class_specifier.long_class_specifier.identifier as string;
      const modelicaPath = `${template.within}.${cd.class_specifier.long_class_specifier.identifier}`;
      const elementListAll =
        cd.class_specifier.long_class_specifier.composition.element_list;
      const elementList = elementListAll.map((el: any) =>
        constructElement(el, modelicaPath),
      );
      models.push({ name, elementList, modelicaPath });
    } else if (cd.class_prefixes === "package") {
      // TODO: handle package files as expected
      // Could just be the package definition,
      // or a single file package that also contains
      // multiple model definitions within
    }
  });

  return models;
};

describe("Basic parser functionality", () => {
  beforeAll(() => {
    // NOTE: if the test modelica package changes it will need to be
    // manually removed to update for tests
    if (!fs.existsSync(tempDirPath)) {
      fs.mkdirSync(tempDirPath);
      execSync(
        `node ${config.MODELICA_DEPENDENCIES}/modelica-json/app.js -f tests/static-data/TestModelicaPackage -o json -d ${tempDirPath}`,
      );
    }
  });

  it("Sucessfully loads the parsed template", () => {
    parseFile(templatePath);
  });

  it("Finds option directly in the template", () => {
    const templateFile = <any>parseFile(templatePath);
    const templateContents = getFileContents(templateFile);

    templateContents.map((m) => {
      console.log(m.elementList);
    });
  });
});

describe("Expected Options are extracted", () => {
  it("Extracts the expected number of template options", () => {});
  it("Ignore 'final' parameters", () => {});
});
