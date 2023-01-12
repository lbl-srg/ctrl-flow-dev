import path from "path";
import fs from "fs";
import { execSync } from "child_process";

import { typeStore } from "./parser";
import config from "../../src/config";

export const TEMPLATE_IDENTIFIER = "__LinkageTemplate";
export const MODELICAPATH = [
  `${config.MODELICA_DEPENDENCIES}/template-json/json/`,
];

function _toModelicaPath(filePath: string) {
  filePath = filePath.endsWith(".json") ? filePath.slice(0, -5) : filePath;
  return filePath.replace(/\//g, ".");
}

export function findPackageEntryPoints(
  prefix: string,
  reference: string,
): { path: string; json: Object | undefined }[] {
  console.log(`********MODELICA_DEPENDENCIES: ${config.MODELICA_DEPENDENCIES}`);
  const entryPoints: { path: string; json: Object | undefined }[] = [];
  [prefix, ...MODELICAPATH].forEach((dir) => {
    const dirPath = path.resolve(dir, reference);
    console.log(`********DIR_PATH_FOR_ENTRY_POINT: ${dir} ${reference} ${dirPath}`);
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
            const path = _toModelicaPath(p);
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
    const modelicaPath = _toModelicaPath(curPath);
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
  const modelicaDirs = [prefix, ...MODELICAPATH];

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
