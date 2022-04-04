import { notDeepEqual } from "assert";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

import config from "../../../src/config";

const tempDirPath = "/tmp/test-linkage-widget";
const templatePath =
  "json/tests/static-data/TestModelicaPackage/Template/TestTemplate.json";

const EXTEND_NAME = "_extend";

interface Model {
  elementList: Element[];
  modelicaPath: string;
  name: string;
}

const parseFile = (filePath: string) => {
  const fullPath = path.resolve(tempDirPath, filePath);
  const templateString = fs.readFileSync(fullPath, { encoding: "utf8" });

  return JSON.parse(templateString);
};

// An entry in the 'Element List'
// can be of type:
// Extends clause
// literal parameter (string, boolean, number(TODO: types?), enum)
// record
// replacable (another model, with choices for other models)
// component (another model)
interface Element {
  modelicaPath: string;
  type: string; // modelica path or literal type
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
    ).declaration;
    const name = declarationBlock.identifier;
    element.modifications =
      declarationBlock.modification?.class_modification || [];
    element.modelicaPath = `${modelicaRoot}.${name}`;
    element.type = componentClause.type_specifier;
  } else if ("extends_clause" in el) {
    const extends_clause = el.extends_clause;
    element.type = extends_clause.name;
    element.modelicaPath = `${modelicaRoot}.${EXTEND_NAME}`;
    element.modifications = extends_clause.class_modification || [];
  }

  return element;
};

// Extracts models/packages
const getFileContents = (template: any) => {
  const models: Model[] = [];
  template.class_definition.map((cd: any) => {
    if (cd.class_prefixes === "model") {
      const name = cd.class_specifier.long_class_specifier.identifier as string;
      const modelicaPath = `${template.within}.${cd.class_specifier.long_class_specifier.identifier}`;
      const elementListAll =
        cd.class_specifier.long_class_specifier.composition.element_list;
      const elementList = elementListAll.map((el: any) =>
        constructElement(el, modelicaPath),
      ) as Element[];
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

  it("Finds elements in the template", () => {
    const templateFile = <any>parseFile(templatePath);
    const templateContents = getFileContents(templateFile);
    const expectedElements = 7;

    templateContents.map((m) => {
      expect(m.elementList.length).toBe(expectedElements);
      m.elementList.map((e) => {
        expect(e.modelicaPath).not.toBeFalsy();
        expect(e.type).not.toBeFalsy();
      });
    });
  });
});

describe("Expected Options are extracted", () => {
  it("Extracts the expected number of template options", () => {});
  it("Ignore 'final' parameters", () => {});
});
