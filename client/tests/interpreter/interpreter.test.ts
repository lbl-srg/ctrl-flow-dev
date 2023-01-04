import RootStore from "../../src/data";
import Config, { ConfigInterface } from "../../src/data/config";
import Template, {
  TemplateInterface,
  OptionInterface,
} from "../../src/data/template";
import {
  evaluateExpression,
  Expression,
  resolveValue,
  Literal,
} from "../../src/utils/expression-helpers";
import { buildModifiers, Modifiers } from "../../src/utils/modifier-helpers";

const addToModObject = (
  newMods: { [key: string]: Expression },
  baseInstancePath: string,
  mods: { [key: string]: Expression },
  options: { [key: string]: OptionInterface },
  recursive = true,
) => {
  Object.entries(newMods).forEach(([k, expression]) => {
    const instanceName = k.split(".").pop();
    const modKey = [baseInstancePath, instanceName]
      .filter((segment) => segment !== "")
      .join(".");

    // Do not add a key that is already present. The assumption is that
    // the first time an instance path is present is the most up-to-date
    if (!(modKey in mods)) {
      mods[modKey] = expression;
    }

    if (recursive) {
      // grab modifiers from original definition
      const modOption = options[k];
      if (modOption?.modifiers) {
        addToModObject(newMods, baseInstancePath, mods, options, false);
      }
    }
  });
};

// recursive helper method that traverses options grabbing modifiers
const buildModsHelper = (
  option: OptionInterface,
  baseInstancePath: string,
  mods: { [key: string]: Expression },
  options: { [key: string]: OptionInterface },
) => {
  if (option === undefined) {
    return; // TODO: not sure this should be allowed - failing with 'Medium'
  }
  const optionMods = option.modifiers as { [key: string]: Expression };
  const childOptions = option.options;

  // grab the current options modifiers
  if (optionMods) {
    addToModObject(optionMods, baseInstancePath, mods, options);
  }

  // if this is a definition - visit all child options and grab modifiers
  if (childOptions) {
    const name = option.modelicaPath.split(".").pop();
    const newBase = option.definition
      ? baseInstancePath
      : [baseInstancePath, name].filter((p) => p !== "").join(".");

    if (option.definition) {
      childOptions.map((path) => {
        const childOption = options[path];

        // recursive call
        buildModsHelper(childOption, newBase, mods, options);
      });
    } else {
      // this is a parameter (either replaceable or enum) - grab the type and its modifiers
      // only use the 'type', not child options to fetch modifiers
      const typeOption = options[option.type];
      if (typeOption && typeOption.options) {
        // add modifiers from type option
        if (typeOption.modifiers) {
          addToModObject(typeOption.modifiers, newBase, mods, options);
        }
        typeOption.options.map((path) => {
          const childOption = options[path];

          buildModsHelper(childOption, newBase, mods, options);
        });
      }
    }
  }
};

const buildMods = (
  startOption: OptionInterface,
  options: { [key: string]: OptionInterface },
) => {
  const mods: { [key: string]: Expression } = {};

  buildModsHelper(startOption, "", mods, options);

  return mods;
};

/**
 * Update path based on path modifiers
 *
 * e.g. if we have a path mod of 'ctl.secOutRel' -> 'secOutRel'
 *
 * The path 'ctl.secOutRel.typ' become 'secOutRel.typ'
 */
export function applyPathModifiers(
  scopePath: string,
  pathModifiers: { [key: string]: string },
): string {
  const splitScopePath = scopePath.split(".");
  let postFix: string | undefined = "";
  let modifiedPath = scopePath;

  while (splitScopePath.length > 0) {
    const testPath = splitScopePath.join(".");
    if (pathModifiers[testPath]) {
      modifiedPath = `${pathModifiers[testPath]}.${postFix}`;
      break;
    }
    postFix = postFix
      ? `${postFix}.${splitScopePath.pop()}`
      : splitScopePath.pop();
  }

  return modifiedPath;
}

/**
 * Given an instance path, pathModifiers, and a reference to options, knows how to return the appropriate
 * modelica path
 *
 * @param instancePath
 * @param pathModifiers
 * @param allOptions
 */
const instancePathToOption = (
  instancePath: string,
  context: ConfigContext,
): string => {
  return instancePath;
};

/**
 * Resolve the symbol
 */
const resolveSymbol = (
  operand: Literal,
  context: ConfigContext,
): Literal | null => {
  let value: any = null;
  if (typeof operand === "string") {
    // check if present in options, if not just return the string, if so check if option
    // is a definition
    let optionPath = instancePathToOption(operand, context);
    let typeOption = context.options[optionPath];
    if (typeOption) {
      if (typeOption.definition) {
        value = typeOption.modelicaPath;
      } else {
        value = typeOption.value;
      }
    } else {
      // treat as instance path. If it does not resolve assume its a string
      // this is a bug as someone could put in a string that mirrors a valid instance path
      // and this would break
      value = instancePathToOption(operand, context);
    }
  }

  return value;
};

/**
 * For the given expression, attempts to return the value
 *
 * expression have symbols. We need to be able to
 * @param context
 * @param expression
 */
const evaluate = (expression: Expression, context: ConfigContext) => {
  let val: Literal | null = null;
  if (expression.operator === "none") {
    val = resolveSymbol(expression.operands[0] as Literal, context);
  }
};

// Cache for initial template values
const _initModCache: { [key: string]: Modifiers } = {};

/**
 * Generating context for a given template and config
 *
 * what is needed:
 * - start option
 * - path modifiers
 * - config
 *
 * Traverse tree:
 * - if a redeclare mod is found for a replaceable, store
 *
 * How to traverse to next branch:
 * - if config selection, use that
 * - if redeclare mod, use that
 * - otherwise: use option value (a replaceable's type)
 *
 */

/**
 * This generates a context that can be queried for values using
 * an instance path
 *
 * When generating the display option list, we need to be able to resolve:
 * - displayed option's initial value
 * - is the option enabled
 * - is the option visible
 */
class ConfigContext {
  mods: Modifiers = {};

  constructor(
    public template: TemplateInterface,
    public config: ConfigInterface,
    public options: { [key: string]: OptionInterface },
  ) {
    if (template.modelicaPath in _initModCache) {
      this.mods = _initModCache[template.modelicaPath];
    } else {
      // calculate intial mods without selections
      buildMods(this.options[template.modelicaPath], this.options);
      // stash in cache
    }

    // update modifier tree with selections
  }

  /**
   * A value or null is returned when an instance path is provided
   *
   * A null instance path means the value cannot be resolved
   * @param instancePath
   */
  getValue(instancePath: string): string | number | boolean | null {
    const val = null;
    const modExpression = this.mods[instancePath]?.expression;

    // modVal will either be a primitive or something else

    // do not cache resolve values as dependencies may change
    return val;
  }
}

let allOptions: { [key: string]: OptionInterface } = {};
let allTemplates: { [key: string]: TemplateInterface } = {};
let template: TemplateInterface | undefined;
let config: ConfigInterface | undefined;

describe("Path Modifier tests", () => {
  it("Applies a path modifier", () => {
    const pathMods = {
      "lets.modify.this.path": "path",
    };
    const longPath = "lets.modify.this.path.changed";
    const modifiedPath = applyPathModifiers(longPath, pathMods);

    expect(modifiedPath).toBe("path.changed");
  });

  it("Correctly leaves paths along if not in the modifier", () => {
    const pathMods = {
      "test.an.inner.replacement": "inner.replacement",
    };
    const longPath = "test.an.unrelated.path";
    const modifiedPath = applyPathModifiers(longPath, pathMods);

    expect(modifiedPath).toBe(longPath);
  });
});

describe("Basic Context generation without selections", () => {
  beforeAll(() => {
    const store = new RootStore();
    store.configStore.add({ name: "test config" });
    allOptions = store.templateStore.getAllOptions();
    allTemplates = store.templateStore.getAllTemplates();
    template = allTemplates["Buildings.Templates.AirHandlersFans.VAVMultiZone"];
    [config] = store.configStore.configs;
  });

  it("Is able to construct a context", () => {
    const context = new ConfigContext(
      template as TemplateInterface,
      config as ConfigInterface,
      allOptions,
    );
  });
});

describe("Path and value resolution without selections and then with selections", () => {
  beforeAll(() => {
    const store = new RootStore();
    store.configStore.add({ name: "test config" });
    allOptions = store.templateStore.getAllOptions();
    allTemplates = store.templateStore.getAllTemplates();
    template = allTemplates["Buildings.Templates.AirHandlersFans.VAVMultiZone"];
    [config] = store.configStore.configs;
  });

  it("Maps an instance path to an option path", () => {
    const context = new ConfigContext(
      template as TemplateInterface,
      config as ConfigInterface,
      allOptions,
    );
  });

  /**
   * This is a test of the simplist values to get, parameters at
   * the root of a template that are assigned a literal. This also tests
   * symbol resolution
   */
  it("Context has root literal types assigned", () => {
    const context = new ConfigContext(
      template as TemplateInterface,
      config as ConfigInterface,
      allOptions,
    );

    instancePathToOption("coiHeaPre.val", context);
  });

  it("Fetches the correct value for a redeclared type", () => {});
});
