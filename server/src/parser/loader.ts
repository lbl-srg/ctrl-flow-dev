import path from "path";
import fs from "fs";
import { execSync } from "child_process";

export const TEMPLATE_IDENTIFIER = "__LinkageTemplate";
export const MODELICAPATH = ['/path/to/json/output'];

function _toModelicaPath(path: string) {
  path = path.endsWith(".json") ? path.slice(0, -5) : path;
  return path.replace(/\//g, ".");
}

export function findPackageEntryPoints(
  prefix: string,
  reference: string,
): { path: string; json: Object | undefined }[] {
  const cmd = `grep -rl ${path.resolve(
    prefix,
    reference,
  )} -e "${TEMPLATE_IDENTIFIER}"`;
  const response = execSync(cmd).toString();
  return response
    .split("\n")
    .filter((p) => p != "")
    .map((p) => path.relative(prefix, p))
    .map((p) => {
      const path = _toModelicaPath(p)
      return {
        path: path,
        json: loader(prefix, path)
      }
    });
}

/**
 * 
 * @param prefix directory to search
 * @param filePath path to try and find
 * 
 * @returns the found file path or null if not found
 */
function _findPath(prefix: string, reference: string): string | null {
  let filePath = path.parse(reference.replace(/\./g, "/"));

  let jsonFile = path.resolve(
    prefix,
    filePath.dir,
    `${filePath.name}.json`,
  );

  while (!fs.existsSync(jsonFile) && filePath.name) {
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

  return (fs.existsSync(jsonFile)) ? jsonFile : null;
}

// When given a path, loads types
export function loader(prefix: string, reference: string): Object | undefined {
  [...MODELICAPATH, prefix].map((dir) => {
    const jsonFile = _findPath(dir, reference);
    if (jsonFile && fs.existsSync(jsonFile)) {
      return require(jsonFile)
    }
  });

  throw new Error(`${prefix} ${reference}. ${reference} could not be found!!`);
}
