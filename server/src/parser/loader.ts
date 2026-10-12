import path from "path";
import fs from "fs";
import { execSync } from "child_process";

import { typeStore } from "./parser";
import { hasQuotedIdent } from "./names";
import config from "../../src/config";

// The following arrays are populated with the ***full class names***
// of templates identified with class annotation __ctrlFlow(routing="template")
// and all packages containing templates up to the root package
// identified with class annotation __ctrlFlow(routing="root").
export const TEMPLATE_LIST: string[] = [];
export const PACKAGE_LIST: string[] = [];

export let MODELICA_JSON_PATH = [
  `${config.MODELICA_DEPENDENCIES}/template-json/json/`,
];

// Used for testing: registers additional search paths for Modelica JSON files
export function prependToModelicaJsonPath(paths: string[]) {
  MODELICA_JSON_PATH = [...paths, ...MODELICA_JSON_PATH];
  // the search path changed, so any previously cached (mis)resolutions are stale
  loaderCache.clear();
  topLevelPackageNames = null;
  typeStore.clearLoadFailures();
}

// Names of the top-level packages loadable from the search path
// (e.g. "Buildings", "Modelica"): the top-level directories and .json files
// of each MODELICA_JSON_PATH entry.
let topLevelPackageNames: Set<string> | null = null;

export function getTopLevelPackageNames(): Set<string> {
  if (!topLevelPackageNames) {
    topLevelPackageNames = new Set<string>();
    for (const dir of MODELICA_JSON_PATH) {
      if (!fs.existsSync(dir)) {
        continue;
      }
      for (const entry of fs.readdirSync(dir)) {
        topLevelPackageNames.add(
          entry.endsWith(".json") ? entry.slice(0, -5) : entry,
        );
      }
    }
  }
  return topLevelPackageNames;
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

// Master list of TemplateNode objects representing all templates and packages.
// It is intended to be used in the future when the UI can handle nested packages.
const templateNodes: TemplateNode[] = [];

export function getClassNameFromRelativePath(filePath: string) {
  filePath = filePath.endsWith(".json") ? filePath.slice(0, -5) : filePath;
  return filePath.replace(/\//g, ".");
}

export function getClassNameFromJson(json: any): string {
  return (
    (json.within ? json.within + "." : "") +
    json.stored_class_definitions[0].class_specifier.long_class_specifier.identifier
  );
}

/**
 * Creates a TemplateNode object from a JSON representation of a Modelica class.
 * @param json - The JSON object containing the Modelica class definition
 * @returns A TemplateNode object with class information
 */
function createTemplateNode(json: any): TemplateNode {
  const classDefinition = json.stored_class_definitions[0];
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

/**
 * Finds all entry points that contain the template identifier for a given package.
 * - LIMITATION: This function requires that the package uses
 *   [Directory Hierarchy Mapping](https://specification.modelica.org/maint/3.6/packages.html#directory-hierarchy-mapping)
 * - Currently, templateNodes is flattened before being returned.
 * - In the future, when the UI can handle nested packages, templateNodes should be
 *   used directly to create the file tree structure.
 * @param packageName - The Modelica class name of the package to search for entry points
 * @returns An array of objects containing the path and parsed JSON for each entry point found
 */
export function findPackageEntryPoints(
  packageName: string,
): { className: string; json: Object | undefined }[] {
  MODELICA_JSON_PATH.forEach((dir) => {
    // We can simply convert the class name to a relative path without adding any file extension
    // because we only need a top directory to look up for entry points.
    const dirPath = path.resolve(dir, packageName.replace(/\./g, "/"));
    if (fs.existsSync(dirPath)) {
      // Find all template files.
      const templatePaths = systemGrep(TEMPLATE_IDENTIFIER, dirPath);

      // Populate arrays storing templates.
      templatePaths?.forEach((p) => {
        const templateJson = loader(p);
        const templateNode = createTemplateNode(templateJson);
        TEMPLATE_LIST.push(templateNode.className);
        templateNodes.push(templateNode);
      });

      // Find root package.
      const rootPackagePath = systemGrep(TEMPLATE_ROOT, dirPath)?.[0];
      if (!rootPackagePath) {
        console.error("Error: root package not found in " + dirPath);
        process.exit(1);
      }
      const rootPackageJson = loader(rootPackagePath);
      const rootPackageName = getClassNameFromJson(rootPackageJson);

      // Iterate over all template files up to the root package and populate
      // templateNodes, TEMPLATE_LIST, PACKAGE_LIST and entryPoints.

      for (let templateJson of [...templateNodes.map(({ json }) => json)]) {
        let packageName = (templateJson as any).within;
        while (packageName) {
          const packagePath = getPathFromClassName(packageName, dir);
          if (!packagePath) {
            break;
          }
          const packageJson = loader(packagePath);
          // If the package is already in the templateNodes array, its parents have also been added.
          if (
            templateNodes
              .map(({ className }) => className)
              .includes(packageName)
          ) {
            break;
          }
          if (!packageJson) {
            continue;
          }
          const packageNode = createTemplateNode(packageJson);
          PACKAGE_LIST.push(packageNode.className);
          templateNodes.push(packageNode);

          if (packageName === rootPackageName) {
            break;
          }
          packageName = (packageJson as any).within;
        }
      }
    }
  });
  PACKAGE_LIST.sort();
  TEMPLATE_LIST.sort();
  templateNodes.sort();
  return templateNodes
    .map(({ className, json }) => {
      return { className, json };
    });
}

/**
 * Gets the path to a Modelica JSON file based on the full class name.
 * @param className - The full Modelica class name (e.g. "Library.Package.Class")
 * @param dirPath - The directory path to search in (e.g. element of MODELICA_JSON_PATH)
 * @returns The file path if found, null otherwise
 */
function getPathFromClassName(
  className: string,
  dirPath: string,
): string | null {
  let filePath = path.parse(className.replace(/\./g, "/"));

  let jsonFile = path.resolve(dirPath, filePath.dir, `${filePath.name}.json`);

  while (!fs.existsSync(jsonFile) && filePath.name) {
    /* Typically modelica class name to file path looks like:
     *   Templates.AirHandlerFans.VAVMultizone -> Templates/AirhandlerFans/VAVMultizone.json
     * For directory mapping of packages, we need to support mapping like:
     *   Templates.AirHandlerFans -> Templates/AirhandlerFans/package.json
     */
    jsonFile = path.resolve(
      dirPath,
      filePath.dir,
      filePath.name,
      "package.json",
    );
    if (fs.existsSync(jsonFile)) {
      break;
    }
    /*
     * We iterate and trim the file path to cover single file mapping of packages:
     * e.g. Buildings.Types.Reset in Buildings/Types.json
     */
    filePath = path.parse(filePath.dir);
    jsonFile = path.resolve(dirPath, filePath.dir, `${filePath.name}.json`);
  }

  return fs.existsSync(jsonFile) ? jsonFile : null;
}

// Keys of class names
const CLASS_NAME_KEYS = new Set(["type_specifier", "within"]);
// Keys of objects holding class names
const CLASS_NAMES_IN: { [key: string]: (value: any) => string[] } = {
  long_class_specifier: (v) => [v.identifier],
  short_class_specifier: (v) => [v.identifier, v.value?.name],
  der_class_specifier: (v) => [
    v.identifier,
    v.der_class_specifier_value?.type_specifier,
  ],
  extends_clause: (v) => [v.name],
  constraining_clause: (v) => [v.name],
  import_clause: (v) => [v.identifier, v.name],
};

// Parsed files by path: an object is parsed once, as the parser keys
// constructed files by object
const jsonCache = new Map<string, Object>();

/**
 * Reads a modelica-json file, rejecting quoted class identifiers: a quoted
 * class cannot be stored with the directory hierarchy mapping (MLS §13.4.1).
 * See docs/selection-keys.md, "Grammar".
 */
function readJson(jsonFile: string): Object {
  const cached = jsonCache.get(jsonFile);
  if (cached) {
    return cached;
  }
  const json = JSON.parse(fs.readFileSync(jsonFile, "utf8"), (key, value) => {
    const classNames =
      typeof value === "string"
        ? CLASS_NAME_KEYS.has(key)
          ? [value]
          : []
        : (CLASS_NAMES_IN[key]?.(value) ?? []);
    const quoted = classNames.find((name) => name && hasQuotedIdent(name));
    if (quoted) {
      throw new Error(
        `Quoted class identifiers are not supported: ${quoted} in ${jsonFile}`,
      );
    }
    return value;
  });
  jsonCache.set(jsonFile, json);
  return json;
}

// Resolving a class name to a file on disk walks the directory tree with
// synchronous fs.existsSync calls. The same class name is looked up
// repeatedly (often thousands of times) while parsing, so cache the result
// (including "not found") since the search path is static during a run.
const loaderCache = new Map<string, Object | undefined>();

/**
 * Loads a Modelica JSON file given the full class name.
 * @param className The full Modelica class name to load (e.g. "Library.Package.Class")
 * @returns The loaded JSON object or undefined if not found
 */
export function loader(className: string): Object | undefined {
  if (loaderCache.has(className)) {
    return loaderCache.get(className);
  }

  let result: Object | undefined;
  if (
    !(
      className.startsWith("Modelica") &&
      !className.startsWith("Modelica.Units")
    )
  ) {
    for (const dir of MODELICA_JSON_PATH) {
      const jsonFile = getPathFromClassName(className, dir);
      if (jsonFile && fs.existsSync(jsonFile)) {
        result = readJson(jsonFile);
        break;
      }
    }
  }

  loaderCache.set(className, result);
  return result;
}
