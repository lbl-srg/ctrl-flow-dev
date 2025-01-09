import path from "path";
import fs from "fs";
import { execSync } from "child_process";

import { typeStore } from "./parser";
import config from "../../src/config";

export const TEMPLATE_IDENTIFIER = "__ctrlFlow_template";
export let MODELICA_JSON_PATH = [
  `${config.MODELICA_DEPENDENCIES}/template-json/json/`,
];

// Used for testing: registers additional search paths for Modelica JSON files
export function prependToModelicaJsonPath(paths: string[]) {
  MODELICA_JSON_PATH = [...paths, ...MODELICA_JSON_PATH];
}

export function getClassNameFromRelativePath(filePath: string) {
  filePath = filePath.endsWith(".json") ? filePath.slice(0, -5) : filePath;
  return filePath.replace(/\//g, ".");
}

export function findPackageEntryPoints(
  className: string,
): { path: string; json: Object | undefined }[] {
  const entryPoints: { path: string; json: Object | undefined }[] = [];
  MODELICA_JSON_PATH.forEach((dir) => {
    const dirPath = path.resolve(dir, className);
    if (fs.existsSync(dirPath)) {
      const cmd = `grep -rl ${dirPath} -e "${TEMPLATE_IDENTIFIER}"`;
      const response = execSync(cmd).toString();
      entryPoints.push(
        ...response
          .split("\n")
          .filter((p) => p != "")
          .sort((a, b) => (a.includes("package.json") ? -1 : 1))
          .map((p) => path.relative(dir, p))
          .map((p) => {
            const path = getClassNameFromRelativePath(p);
            return {
              path: path,
              json: loader(path),
            };
          }),
      );
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
