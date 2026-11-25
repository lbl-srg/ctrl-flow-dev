import path from "path";
import fs from "fs";
import { execSync } from "child_process";

import { typeStore } from "./parser";
import { hasQuotedIdent, lastIdent, memberName } from "./names";
import config from "../../src/config";

// The following arrays are populated with the ***full class names***
// of templates identified with class annotation __ctrlFlow(routing="template")
// and all packages containing templates up to the root package
// identified with class annotation __ctrlFlow(routing="root"),
// in the order of the library (docs/template-order.md).
export const TEMPLATE_LIST: string[] = [];
export const PACKAGE_LIST: string[] = [];

// Name of the root package of the templates, undefined if no package is loaded
let rootPackage: string | undefined;

export function getRootPackage(): string | undefined {
  return rootPackage;
}

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

// The following regexp is prettyPrint safe (\s*) when used with GNU (not BSD) grep -z.
// It only selects the files that may declare a template: the class annotation
// is read from the modelica-json of each class definition.
const TEMPLATE_IDENTIFIER =
  'annotation.*__ctrlFlow.*name":\\s*"routing".*simple_expression":\\s*"\\\\"template\\\\"';

type TemplateNode = {
  className: string;
  // modelica-json of the file storing the class
  json: any;
  // Class definition, from stored_class_definitions or from the composition
  // of the enclosing class
  definition: any;
  // Description string of the class
  description: string | undefined;
  isPackage: boolean;
  // Name of the enclosing class, null for a top-level class
  parentName: string | null;
  // True if the class is stored with the directory hierarchy mapping (MLS 13.4.1)
  isDirectory: boolean;
  // Value of the class annotation __ctrlFlow(routing=...)
  routing: string | undefined;
  // Positions of the classes from the root package, excluded, to the class,
  // included (docs/template-order.md, rule 3)
  orderKey: number[];
};

// Classes of the chains from the root package to the templates, in the order
// of the library.
// It is intended to be used in the future when the UI can handle nested packages.
const templateNodes: TemplateNode[] = [];

export function getClassNameFromRelativePath(filePath: string) {
  filePath = filePath.endsWith(".json") ? filePath.slice(0, -5) : filePath;
  return filePath.replace(/\//g, ".");
}

export function getClassNameFromJson(json: any): string {
  return memberName(
    json.within ?? "",
    json.stored_class_definitions[0].class_specifier.long_class_specifier
      .identifier,
  );
}

/** Identifier of a class definition */
function getIdentifier(definition: any): string {
  const specifier = definition.class_specifier;
  return (
    specifier.long_class_specifier ??
    specifier.short_class_specifier ??
    specifier.der_class_specifier
  ).identifier;
}

/** Class definitions declared in a class definition, in the order of the source */
function getClassDefinitions(definition: any): any[] {
  const composition =
    definition.class_specifier.long_class_specifier?.composition;
  if (!composition) {
    return [];
  }
  return [
    ...(composition.element_list ?? []),
    ...(composition.element_sections ?? []).flatMap((section: any) => [
      ...(section.public_element_list ?? []),
      ...(section.protected_element_list ?? []),
    ]),
  ]
    .filter((element: any) => element.class_definition)
    .map((element: any) => element.class_definition);
}

/** Value of the class annotation __ctrlFlow(routing=...) of a class definition */
function getRouting(definition: any): string | undefined {
  const getModifications = (list: any[] | undefined) =>
    (list ?? []).map(
      (m) => m.element_modification_or_replaceable?.element_modification,
    );
  const ctrlFlow = getModifications(
    definition.class_specifier.long_class_specifier?.composition?.annotation,
  ).find((m) => m?.name === "__ctrlFlow");
  const routing = getModifications(
    ctrlFlow?.modification?.class_modification,
  ).find((m) => m?.name === "routing");
  const value = routing?.modification?.expression?.simple_expression;
  return value === undefined ? undefined : JSON.parse(value);
}

function createTemplateNode(
  json: any,
  definition: any,
  className: string,
  parentName: string | null,
  isDirectory: boolean,
): TemplateNode {
  return {
    className,
    json,
    definition,
    description:
      definition.class_specifier.long_class_specifier?.description_string,
    isPackage: definition.class_prefixes.includes("package"),
    parentName,
    isDirectory,
    routing: getRouting(definition),
    orderKey: [],
  };
}

/** Node of the class stored in a file, i.e. its first stored class definition */
function createFileNode(json: any): TemplateNode {
  return createTemplateNode(
    json,
    json.stored_class_definitions[0],
    getClassNameFromJson(json),
    json.within ? json.within : null,
    path.basename(json.modelicaFile) === "package.mo",
  );
}

/**
 * Adds to `nodes` the templates declared in `node` (included), and the
 * classes enclosing them in the same file.
 * @returns True if a template is declared in `node`
 */
function addTemplateNodes(
  node: TemplateNode,
  nodes: Map<string, TemplateNode>,
): boolean {
  const hasTemplate = getClassDefinitions(node.definition)
    .map((definition) =>
      addTemplateNodes(
        createTemplateNode(
          node.json,
          definition,
          memberName(node.className, getIdentifier(definition)),
          node.className,
          false,
        ),
        nodes,
      ),
    )
    .includes(true);
  if (node.routing === "template" || hasTemplate) {
    if (!nodes.has(node.className)) {
      nodes.set(node.className, node);
    }
    return true;
  }
  return false;
}

/**
 * Node of the class enclosing `node`. A class enclosing the class of a file
 * is the class of another file (MLS 13.4).
 */
function getEnclosingNode(
  node: TemplateNode,
  nodes: Map<string, TemplateNode>,
): TemplateNode {
  const parentName = node.parentName as string;
  const loaded = nodes.get(parentName);
  if (loaded) {
    return loaded;
  }
  const json = loader(parentName);
  if (!json || getClassNameFromJson(json) !== parentName) {
    throw new Error(
      `Cannot load the package ${parentName} enclosing ${node.className}`,
    );
  }
  const parent = createFileNode(json);
  nodes.set(parentName, parent);
  return parent;
}

/**
 * Position of `node` in the class `parent` enclosing it
 * (docs/template-order.md, rules 1, 2 and 7)
 */
function getPosition(node: TemplateNode, parent: TemplateNode): number {
  const ident = lastIdent(node.className);
  if (parent.isDirectory) {
    const order: string[] | undefined = parent.json.order;
    if (!order) {
      throw new Error(`Missing package.order in ${parent.className}`);
    }
    const count = order.filter((o) => o === ident).length;
    if (count === 0) {
      throw new Error(
        `${ident} is not listed in the package.order of ${parent.className}`,
      );
    }
    if (count > 1) {
      throw new Error(
        `${ident} is listed more than once in the package.order of ${parent.className}`,
      );
    }
    return order.indexOf(ident);
  }
  const position = getClassDefinitions(parent.definition)
    .map(getIdentifier)
    .indexOf(ident);
  if (position === -1) {
    throw new Error(`${ident} is not declared in ${parent.className}`);
  }
  return position;
}

/**
 * Compares order keys lexicographically: a key comes before every key it is
 * a prefix of (docs/template-order.md, rule 4)
 */
function compareOrderKeys(a: number[], b: number[]): number {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      return a[i] - b[i];
    }
  }
  return a.length - b.length;
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
 * Finds the templates of a package, the packages enclosing them up to the
 * root package, and the files storing them, in the order of the library
 * (docs/template-order.md).
 * - LIMITATION: This function requires that the package uses
 *   [Directory Hierarchy Mapping](https://specification.modelica.org/maint/3.7/packages.html#directory-hierarchy-mapping)
 * - Currently, templateNodes is flattened before being returned.
 * - In the future, when the UI can handle nested packages, templateNodes should be
 *   used directly to create the file tree structure.
 * @param packageName - The Modelica class name of the package to search for entry points
 * @returns An array of objects containing the class name and parsed JSON of each file to load
 */
export function findPackageEntryPoints(
  packageName: string,
): { className: string; json: Object }[] {
  TEMPLATE_LIST.length = 0;
  PACKAGE_LIST.length = 0;
  templateNodes.length = 0;
  rootPackage = undefined;

  // Find the templates and the classes enclosing them in their files.
  const nodes = new Map<string, TemplateNode>();
  MODELICA_JSON_PATH.forEach((dir) => {
    // We can simply convert the class name to a relative path without adding any file extension
    // because we only need a top directory to look up for entry points.
    const dirPath = path.resolve(dir, packageName.replace(/\./g, "/"));
    if (fs.existsSync(dirPath)) {
      systemGrep(TEMPLATE_IDENTIFIER, dirPath)?.forEach((p) =>
        addTemplateNodes(createFileNode(readJson(p)), nodes),
      );
    }
  });
  const templates = [...nodes.values()].filter(
    ({ routing }) => routing === "template",
  );
  if (templates.length === 0) {
    throw new Error(
      `No template (class annotation __ctrlFlow(routing="template")) in ${packageName}`,
    );
  }

  // Find the classes enclosing each template up to the root package, and
  // compute their order keys from the root package down.
  const chainNodes = new Set<TemplateNode>();
  const roots = new Set<string>();
  templates.forEach((template) => {
    const chain = [template];
    while (chain[0].routing !== "root") {
      if (chain[0].parentName === null) {
        throw new Error(
          `No root package (class annotation __ctrlFlow(routing="root")) encloses ${template.className}`,
        );
      }
      chain.unshift(getEnclosingNode(chain[0], nodes));
    }
    roots.add(chain[0].className);
    chain.slice(1).forEach((node, i) => {
      node.orderKey = [...chain[i].orderKey, getPosition(node, chain[i])];
    });
    chain.forEach((node) => chainNodes.add(node));
  });
  if (roots.size > 1) {
    throw new Error(
      `The templates of ${packageName} are in several root packages: ${[...roots].join(", ")}`,
    );
  }
  rootPackage = [...roots][0];

  templateNodes.push(
    ...[...chainNodes].sort((a, b) => compareOrderKeys(a.orderKey, b.orderKey)),
  );
  TEMPLATE_LIST.push(
    ...templateNodes
      .filter(({ routing }) => routing === "template")
      .map(({ className }) => className),
  );
  PACKAGE_LIST.push(
    ...templateNodes
      .filter(({ isPackage }) => isPackage)
      .map(({ className }) => className),
  );

  // Files storing the classes, in the order of their first class
  const files = new Map<Object, string>();
  templateNodes.forEach(({ json }) => {
    if (!files.has(json)) {
      files.set(json, getClassNameFromJson(json));
    }
  });
  return [...files].map(([json, className]) => ({ className, json }));
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
