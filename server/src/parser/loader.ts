
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

import { typeStore } from "./parser";
import config from "../../src/config";

// The following arrays are populated with the ***full class names***
// of templates (identified with class annotation __ctrlFlow(routing = "template")
// and all packages containing templates up to the root package
// (identified with class annotation __ctrlFlow(routing = "root").
export const TEMPLATE_LIST: string[] = [];
export const PACKAGE_LIST: string[] = [];

export let MODELICA_JSON_PATH = [
  `${config.MODELICA_DEPENDENCIES}/template-json/json/`,
];

// Used for testing: registers additional search paths for Modelica JSON files
export function prependToModelicaJsonPath(paths: string[]) {
  MODELICA_JSON_PATH = [...paths, ...MODELICA_JSON_PATH];
}

// The following regexp are prettyPrint safe (\s*) when used with GNU (not BSD) grep -z
const TEMPLATE_ROOT =
  'annotation.*__ctrlFlow.*name":\\s*"routing".*simple_expression":\\s*"\\\\"root\\\\"';
const TEMPLATE_IDENTIFIER =
  'annotation.*__ctrlFlow.*name":\\s*"routing".*simple_expression":\\s*"\\\\"template\\\\"';

type TemplateNode = {
  className: string;
  description: string;
  json: Object;
  isPackage: boolean;
  parentName: string | null;
};

export function getClassNameFromRelativePath(filePath: string) {
  filePath = filePath.endsWith(".json") ? filePath.slice(0, -5) : filePath;
  return filePath.replace(/\//g, ".");
}

export function getClassNameFromJson(json: any): string {
  return (
    (json.within ? json.within + "." : "") +
    json.class_definition[0].class_specifier.long_class_specifier.identifier
  );
}

function getWithinFromClassName(className: string): string {
  return className.split(".").slice(0, -1).join(".");
}

/**
 * Creates a TemplateNode object from a JSON representation of a Modelica class.
 * @param json - The JSON object containing the Modelica class definition
 * @returns A TemplateNode object with class information
 */
function createTemplateNode(json: any): TemplateNode {
  const classDefinition = json.class_definition[0];
  return {
    className: getClassNameFromJson(json),
    description:
      classDefinition.class_specifier.long_class_specifier.description_string,
    json: json,
    isPackage: classDefinition.class_prefixes.includes("package"),
    parentName: json.within ?? null,
  };
}

/**
 * Executes a system grep command to search for a regular expression pattern in files.
 * @param regExp - The regular expression pattern to search for
 * @param dirPath - The directory path to search in
 * @returns Array of matching file paths or null if no matches found
 */
function systemGrep(regExp: string, dirPath: string): string[] | null {
  const cmd = `grep -lrz '${regExp}' ${dirPath}`;
  try {
    return execSync(cmd)
      .toString()
      .split("\n")
      .filter((p) => p != "");
  } catch (error) {
    return null;
  }
}

export function findPackageEntryPoints(
  className: string,
): { path: string; json: Object | undefined }[] {
  const templates: any[] = [];
  const templateNodes: TemplateNode[] = [];
  const entryPoints: { path: string; json: Object | undefined }[] = [];
  MODELICA_JSON_PATH.forEach((dir) => {
    const dirPath = path.resolve(dir, className.replace(/\./g, "/"));
    if (fs.existsSync(dirPath)) {
      // Find all template files.
      const templatePaths = systemGrep(TEMPLATE_IDENTIFIER, dirPath);
      templatePaths?.forEach((p) => {
        templates.push(require(p));
      });

      // Find root package.
      const rootPackagePath = systemGrep(TEMPLATE_ROOT, dirPath)?.[0];
      if (!rootPackagePath) {
        console.error("Error: root package not found in: " + dirPath);
        process.exit(1);
      }
      const rootPackageJson = require(rootPackagePath);
      const rootPackageName = getClassNameFromJson(rootPackageJson);

      // Iterate over all template files up to the root package and populate the templateNodes array.
      for (let template of templates) {
        const templateNode = createTemplateNode(template);
        TEMPLATE_LIST.push(templateNode.className);
        templateNodes.push(templateNode);
        let packageName = template.within;
        while (packageName && packageName !== rootPackageName) {
          const packagePath = getPathFromClassName(packageName, dirPath);
          if (!packagePath) {
            break;
          }
          const packageJson = require(packagePath);
          // If the package is already in the templateNodes array, its parents have also been added.
          if (
            templateNodes
              .map(({ className }) => className)
              .includes(packageName)
          ) {
            break;
          }
          const packageNode = createTemplateNode(packageJson);
          PACKAGE_LIST.push(packageNode.className);
          templateNodes.push(packageNode);

          // Temporary fix until the UI can handle nested packages:
          // We only store in entryPoints the immediate parent package.
          if (packageName === templateNode.parentName) {
            const relativePath = path.relative(dir, packagePath);
            entryPoints.push({
              path: relativePath,
              json: getClassNameFromRelativePath(relativePath),
            })
          }

          packageName = packageJson.within;
        }
      }
    }
  });

  return entryPoints;
}

/**
 * Gets the path to a Modelica JSON file based on the full class name.
 * @param className - The full Modelica class name (e.g. "Library.Package.Class")
 * @param dirPath - The directory path to search in
 * @returns The file path if found, null otherwise
 */
function getPathFromClassName(
  className: string,
  dirPath: string,
): string | null {
  let filePath = path.parse(className.replace(/\./g, "/"));

  let jsonFile = path.resolve(dirPath, filePath.dir, `${filePath.name}.json`);

  while (!fs.existsSync(jsonFile) && filePath.name) {
    // check if definition already exists
    // TODO - construct this path correctly...
    const curPath = path.relative(filePath.dir, filePath.name);
    const modelicaPath = getClassNameFromRelativePath(curPath);
    if (typeStore.has(modelicaPath)) {
      break;
    }
    // package definitions break the typical modelica path to file mapping that
    // is used. A typical modelica path to file path look like:
    //   'Template.AirHandlerFans.VAVMultizone' -> 'Template/AirhandlerFans/VAVMultizone.json'
    // We need to support mapping like this as well:
    //   'Template.AirHandlerFans -> Template/AirhandlerFans/package.json'
    jsonFile = path.resolve(
      dirPath,
      filePath.dir,
      filePath.name,
      "package.json",
    );
    if (fs.existsSync(jsonFile)) {
      break;
    }
    filePath = path.parse(filePath.dir);
    jsonFile = path.resolve(dirPath, filePath.dir, `${filePath.name}.json`);
  }

  return fs.existsSync(jsonFile) ? jsonFile : null;
}

/**
 * Loads a Modelica JSON file given the full class name.
 * @param className The full Modelica class name to load (e.g. "Library.Package.Class")
 * @returns The loaded JSON object or undefined if not found
 */
export function loader(className: string): Object | undefined {
  // TODO: allow modelica paths
  if (!className.startsWith("Modelica")) {
    for (const dir of MODELICA_JSON_PATH) {
      const jsonFile = getPathFromClassName(className, dir);
      if (jsonFile && fs.existsSync(jsonFile)) {
        return require(jsonFile);
      }
    }
  }
}