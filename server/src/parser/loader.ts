
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

export const MODELICA_JSON_PATH = [
  `${config.MODELICA_DEPENDENCIES}/template-json/json/`,
];

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

function getClassNameFromPath(filePath: string) {
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
  prefix: string,
  reference: string,
): { path: string; json: Object | undefined }[] {
  const templates: any[] = [];
  const templateNodes: TemplateNode[] = [];
  const entryPoints: { path: string; json: Object | undefined }[] = [];
  [prefix, ...MODELICA_JSON_PATH].forEach((dir) => {
    const dirPath = path.resolve(dir, reference);
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
              json: loader(dir, path),
            })
          }

          packageName = packageJson.within;
        }
      }

      entryPoints.push(
        ...response
          .split("\n")
          .filter((p) => p != "")
          .sort((a, b) => (a.includes("package.json") ? -1 : 1))
          .map((p) => path.relative(dir, p))
          .map((p) => {
            const path = getClassNameFromPath(p);
            return {
              path: path,
              json: loader(dir, path),
            };
          }),
      );
    }
  });

  return entryPoints;
}

/**
 * Searched the provided directory for a given
 * @param prefix directory to search
 * @param filePath path to try and find
 *
 * @returns the found file path or null if not found
 */
function _findPath(prefix: string, reference: string): string | null {
  let filePath = path.parse(reference.replace(/\./g, "/"));

  let jsonFile = path.resolve(prefix, filePath.dir, `${filePath.name}.json`);

  while (!fs.existsSync(jsonFile) && filePath.name) {
    // check if definition already exists
    // TODO - construct this path correctly...
    const curPath = path.relative(filePath.dir, filePath.name);
    const modelicaPath = getClassNameFromPath(curPath);
    if (typeStore.has(modelicaPath)) {
      break;
    }
    // package definitions break the typical modelica path to file mapping that
    // is used. A typical modelica path to file path look like:
    //  'Template.AirHandlerFans.VAVMultizone' -> 'Template/AirhandlerFans/VAVMultizone
    // We need to support mapping like this as well:
    //  'Template.AirHandlerFans -> Template/AirhandlerFans/package'
    // 'package' files behave kind of like 'index.html' files
    jsonFile = path.resolve(
      prefix,
      filePath.dir,
      filePath.name,
      "package.json",
    );
    if (fs.existsSync(jsonFile)) {
      break;
    }
    filePath = path.parse(filePath.dir);
    jsonFile = path.resolve(prefix, filePath.dir, `${filePath.name}.json`);
  }

  return fs.existsSync(jsonFile) ? jsonFile : null;
}

// When given a path, loads types. returns null if not found
export function loader(prefix: string, reference: string): Object | undefined {
  const modelicaDirs = [prefix, ...MODELICA_JSON_PATH];

  // TODO: allow modelica paths
  if (!reference.startsWith("Modelica")) {
    for (const dir of modelicaDirs) {
      const jsonFile = _findPath(dir, reference);
      if (jsonFile && fs.existsSync(jsonFile)) {
        return require(jsonFile);
      }
    }
  }
}
