/**
 * Equivalence of the interpreter before and after splitting
 * `_instancePathToOption` into separate resolution functions (#636,
 * docs/selection-keys.md, "Interpreter structure").
 *
 * `./legacy` holds the interpreter and the display mapping as they were before
 * the split. For every template and every reachable instance path, both
 * resolve the same option and value (see `comparable`). For each case, they
 * also build the same modifiers, display mapping, evaluated values and valid
 * selections. This test and `./legacy` are removed when the selection keys
 * change (#620), which changes the behavior.
 *
 * Cases: default values, and each choice of each replaceable element
 * displayed with default values (default values only for the heat pump plant,
 * unless EQUIVALENCE=full). Instance paths are reachable if the interpreter
 * visits them when walking the classes of the elements, as
 * `visitTemplateNodes` does.
 */
import * as zlib from "zlib";
import * as fs from "fs";
import * as path from "path";
import { isDeepStrictEqual } from "util";
import RootStore from "../../src/data";
import { TemplateInterface, OptionInterface } from "../../src/data/template";
import { ConfigValues } from "../../src/utils/modifier-helpers";
import { lastIdent } from "../../src/utils/names";
import * as current from "../../src/interpreter/interpreter";
import * as currentDisplay from "../../src/interpreter/display-option";
import * as legacy from "./legacy/interpreter";
import * as legacyDisplay from "./legacy/display-option";
import { projectSelections } from "./interpreter.test-utils";

type Options = { [key: string]: OptionInterface };
type Dataset = {
  template: TemplateInterface;
  options: Options;
  selections: ConfigValues;
};
type Case = { name: string; selections: ConfigValues };
type Context = legacy.ConfigContext | current.ConfigContext;

const PLANT = "Buildings.Templates.Plants.HeatPumps.AirToWater";

const fixture = (file: string) => require(`../data/${file}`);

const toOptions = (list: OptionInterface[]): Options =>
  Object.fromEntries(list.map((o) => [o.modelicaPath, o]));

const datasets = (): Dataset[] => {
  const store = new RootStore();
  const options = store.templateStore.getAllOptions();
  const templates = Object.values(store.templateStore.getAllTemplates()).map(
    (template) => ({ template, options, selections: projectSelections }),
  );

  // Template not yet in production, see interpreter-record.test.ts
  const gz = JSON.parse(
    zlib
      .gunzipSync(
        fs.readFileSync(path.join(__dirname, "../data/templates.json.gz")),
      )
      .toString(),
  );
  const plant = {
    template: gz.templates.find(
      (t: TemplateInterface) => t.modelicaPath === PLANT,
    ),
    options: toOptions(gz.options),
    selections: projectSelections,
  };

  const testTemplate = (modelicaPath: string, options: Options) => ({
    template: { modelicaPath, name: "", systemTypes: [], pathModifiers: {} },
    options,
    selections: {},
  });
  const quoted = fixture("options-QuotedTemplate.json");

  return [
    ...templates,
    plant,
    testTemplate(
      "TestPackage.Template.TestTemplate",
      fixture("options-TestTemplate.json"),
    ),
    testTemplate("TestRecord", fixture("options-TestRecord.json")),
    { template: quoted.template, options: quoted.options, selections: {} },
  ];
};

const createContext = (
  lib: typeof legacy | typeof current,
  dataset: Dataset,
  selections: ConfigValues,
): Context =>
  new lib.ConfigContext(
    dataset.template,
    { selections } as any,
    dataset.options,
    selections,
  );

/**
 * Walks the classes of the elements, as `visitTemplateNodes` does: calls
 * `visit` for each instance path, and descends into the class it returns. The
 * walk does not descend into outer elements, whose elements are reached at
 * the inner declaration: only their own elements are visited.
 */
function walk(
  context: Context,
  visit: (
    instancePath: string,
  ) => { classPath: string; isOuter: boolean } | undefined,
) {
  const paths = new Set<string>();
  const visitClass = (
    instancePath: string,
    classPath: string,
    descend = true,
  ) =>
    context.options[classPath]?.options?.forEach((o) => {
      const option = context.options[o];
      // Enumeration literals and nested long class definitions are not elements
      if (!option || (option.definition && !option.shortExclType)) {
        return;
      }
      const childPath = [instancePath, lastIdent(o)]
        .filter((p) => p !== "")
        .join(".");
      if (paths.has(childPath)) {
        return;
      }
      paths.add(childPath);
      const child = visit(childPath);
      if (child && descend) {
        visitClass(childPath, child.classPath, !child.isOuter);
      }
    });
  visitClass("", context.template.modelicaPath);
}

/**
 * Default values, and each choice of each replaceable element displayed with
 * default values
 */
function cases(dataset: Dataset): Case[] {
  const base = dataset.selections;
  const context = createContext(legacy, dataset, base) as legacy.ConfigContext;
  const choiceCases: Case[] = [];
  walk(context, (instancePath) => {
    const instance = outcome(() => context.getOptionInstance(instancePath));
    if (!instance || "error" in instance) {
      return;
    }
    const { option } = instance;
    if (instance.display && option?.replaceable) {
      const key = legacy.constructSelectionPath(
        option.modelicaPath,
        instancePath,
      );
      (option.options ?? []).forEach((choice) =>
        choiceCases.push({
          name: `${instancePath}=${lastIdent(choice)}`,
          selections: { ...base, [key]: choice },
        }),
      );
    }
    return {
      classPath: instance.type || option?.type,
      isOuter: instance.isOuter,
    };
  });
  return [{ name: "default", selections: base }, ...choiceCases];
}

/**
 * Result of `fn`, or the error it throws. The legacy interpreter exceeds the
 * call stack on some evaluation cycles, e.g. at
 * ctl.ctl.ctlFloMin.nEnaChiWat in the heat pump plant: the current one must
 * then throw too.
 */
function outcome<T>(fn: () => T): T | { error: string } {
  try {
    return fn();
  } catch (e) {
    return { error: (e as Error).name };
  }
}

const resolution = (
  lib: typeof legacy | typeof current,
  context: Context,
  instancePath: string,
) => ({
  resolved: outcome(() => {
    const {
      optionPath,
      instancePath: resolvedPath,
      outerOptionPath,
    } = lib.resolvePaths(instancePath, context as any);
    return { optionPath, resolvedPath, outerOptionPath };
  }),
  instance: outcome(() => {
    const instance = context.getOptionInstance(instancePath);
    return (
      instance && {
        option: instance.option?.modelicaPath,
        instancePath: instance.instancePath,
        value: instance.value,
        display: instance.display,
        isOuter: instance.isOuter,
        type: instance.type,
      }
    );
  }),
  value: outcome(() => context.getValue(instancePath)),
});

/**
 * What is compared at an instance path: the option and the value. Not
 * compared:
 * - the class of the element (`type`), now given by `effectiveClass`, which
 *   differs for records bound to other records (the legacy class is the one
 *   of the binding target), redeclarations with a binding
 *   (`redeclare Rec rec = localRec`) and instances of short classes. Its
 *   effect is compared through the modifiers and the display mapping;
 * - `outerOptionPath`, which only gave `isOuter` (compared) in the legacy
 *   interpreter;
 * - the option, if the legacy one does not exist: datAll, whose inner
 *   declaration is outside of the template, is now declared by its outer
 *   declaration.
 */
const comparable = (
  r: ReturnType<typeof resolution>,
  legacyOptionExists: boolean,
) => ({
  resolved:
    "error" in r.resolved
      ? r.resolved
      : {
          optionPath: legacyOptionExists ? r.resolved.optionPath : undefined,
          resolvedPath: r.resolved.resolvedPath,
        },
  instance:
    r.instance && !("error" in r.instance)
      ? {
          ...r.instance,
          option: legacyOptionExists ? r.instance.option : undefined,
          type: undefined,
        }
      : r.instance,
  value: r.value,
});

/** Differences between the legacy and the current interpreter for a case */
function differences(dataset: Dataset, selections: ConfigValues) {
  const diffs: { [key: string]: { legacy: unknown; current: unknown } } = {};
  const compare = (key: string, a: unknown, b: unknown) => {
    if (isDeepStrictEqual(a, b)) {
      return;
    }
    try {
      expect(b).toEqual(a);
    } catch {
      diffs[key] = { legacy: a, current: b };
    }
  };
  const legacyContext = createContext(legacy, dataset, selections);
  const currentContext = createContext(current, dataset, selections);
  compare("mods", legacyContext.mods, currentContext.mods);
  walk(legacyContext, (instancePath) => {
    const a = resolution(legacy, legacyContext, instancePath);
    const b = resolution(current, currentContext, instancePath);
    const legacyOptionPath =
      "error" in a.resolved ? undefined : a.resolved.optionPath;
    const legacyOptionExists =
      !legacyOptionPath || legacyOptionPath in dataset.options;
    compare(
      instancePath,
      comparable(a, legacyOptionExists),
      comparable(b, legacyOptionExists),
    );
    const instance = a.instance;
    return instance && !("error" in instance)
      ? {
          classPath:
            instance.type || dataset.options[instance.option as string]?.type,
          isOuter: instance.isOuter,
        }
      : undefined;
  });

  // Display mapping and values saved with the configuration
  const legacyDisplayContext = createContext(legacy, dataset, selections);
  const currentDisplayContext = createContext(current, dataset, selections);
  compare(
    "display",
    legacyDisplay.mapToDisplayOptions(
      legacyDisplayContext as legacy.ConfigContext,
    ),
    currentDisplay.mapToDisplayOptions(
      currentDisplayContext as current.ConfigContext,
    ),
  );
  compare(
    "evaluatedValues",
    legacyDisplayContext.getEvaluatedValues(),
    currentDisplayContext.getEvaluatedValues(),
  );
  compare(
    "validSelections",
    Object.keys(selections).filter((k) =>
      legacyDisplayContext.isValidSelection(k),
    ),
    Object.keys(selections).filter((k) =>
      currentDisplayContext.isValidSelection(k),
    ),
  );
  return diffs;
}

describe("Interpreter equivalence before and after the split (#636)", () => {
  datasets().forEach((dataset) => {
    const templatePath = dataset.template.modelicaPath;
    // The plant has 18k reachable instance paths: its choices take minutes
    const all = templatePath !== PLANT || process.env.EQUIVALENCE === "full";
    describe(templatePath, () => {
      it.each(
        cases(dataset)
          .slice(0, all ? undefined : 1)
          .map((c) => [c.name, c]),
      )("%s", (_, c) => {
        expect(differences(dataset, (c as Case).selections)).toEqual({});
      });
    });
  });
});
