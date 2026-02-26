/**
 * Schedule builder - creates hierarchical table structures from Modelica record classes
 *
 * This module traverses a Modelica record class hierarchy and extracts parameter
 * information into a table structure suitable for UI rendering.
 *
 * ## Example Usage
 *
 * ```typescript
 * import { buildParameterTable } from "./parser/schedule";
 *
 * // Build a parameter table for the record
 * const table = buildParameterTable("Buildings.Templates.AirHandlersFans.Data.VAVMultiZone");
 *
 * // Access the hierarchical columns
 * table.columns.forEach(column => {
 *   if (column.kind === "leaf") {
 *     console.log(`Parameter: ${column.label}`);
 *     console.log(`  Key: ${column.key}`);         // relative instance path, e.g. "ctl.k"
 *     console.log(`  Unit: ${column.unit}`);
 *     console.log(`  Display Unit: ${column.displayUnit}`);
 *     console.log(`  Min: ${column.min}, Max: ${column.max}`);
 *     console.log(`  Enable: ${column.enable}`);   // undefined means always enabled
 *   } else {
 *     console.log(`Group: ${column.label} with ${column.children.length} children`);
 *   }
 * });
 *
 * // Add cells at runtime; rowIndex groups cells into logical rows.
 * // To retrieve the enable expression for a cell, look up the LeafColumn by columnKey.
 * table.cells.push(
 *   { rowIndex: 0, columnKey: "ctl.k", value: 1.5 },
 *   { rowIndex: 0, columnKey: "coiHeaReh.dpAir_nominal", value: 250 },
 * );
 * ```
 *
 * ## Column Structure
 *
 * - **LeafColumn**: Represents a single parameter
 *   - `key`: instance path relative to the top-level record
 *   - `label`: description string or parameter name
 *   - `unit`, `displayUnit`: resolved by walking the type alias chain
 *     (e.g. `PressureDifference → Pressure → Real(unit="Pa")`)
 *   - `min`, `max`, `start`: numeric bounds or runtime Expression objects
 *   - `enable`: `false` or an Expression if conditionally disabled; absent means always enabled.
 *     Determined by `__ctrlFlow(enable=false)` (takes precedence) or `Dialog(enable=...)`.
 *
 * - **GroupColumn**: Represents a collection of parameters.
 *   - Created from `Dialog(group=...)` or `Dialog(tab=...)` annotations
 *   - Created for record-typed component instances (children are the record's parameters)
 *   - Can be nested arbitrarily deep
 */

import {
  typeStore,
  Element,
  LongClass,
  ShortClass,
  Component,
  MLS_PREDEFINED_TYPES,
  isInputGroup,
} from "./parser";
import { Modification } from "./modification";
import { evaluateExpression, Expression, Literal } from "./expression";

// --- Header definitions ---

export interface LeafColumn {
  kind: "leaf";
  key: string; // unique identifier, e.g. "cooling_air_flow"
  label: string; // display label, e.g. "Air flow rate"
  value?: number | string | boolean | Expression; // default binding; absent if unset
  final?: boolean; // true if the value is locked by a final modifier
  unit?: string;
  displayUnit?: string;
  min?: number | Expression;
  max?: number | Expression;
  start?: number | Expression;
  enable?: boolean | Expression; // __ctrlFlow.enable=false overrides Dialog.enable; otherwise use Dialog.enable
}

export interface GroupColumn {
  kind: "group";
  label: string; // e.g. "Cooling coil"
  children: Column[]; // can nest arbitrarily deep
  enable?: boolean | Expression; // __ctrlFlow.enable=false overrides Dialog.enable; otherwise use Dialog.enable
}

export type Column = LeafColumn | GroupColumn;

// --- Cell ---

export interface Cell {
  rowIndex: number;
  columnKey: string; // matches a LeafColumn key; use table.columns to look up column.enable
  value: string | number | boolean | null;
}

// --- Full table ---

export interface Table {
  modelicaPath: string; // fully-qualified class name of the record, e.g. "Buildings.Templates.AirHandlersFans.Data.VAVMultiZone"
  configuration: string; // final type (after redeclare) of the component with instance name 'cfg'
  columns: Column[]; // tree of headers
  cells: Cell[];
}

/**
 * Builds a parameter table from a Modelica class by traversing its
 * inheritance and composition tree.
 */
export function buildParameterTable(className: string): Table {
  const element = typeStore.get(className);

  if (!element) {
    throw new Error(`Class ${className} not found in typeStore`);
  }

  const columns = buildColumnsFromElement(element);

  // Find the 'cfg' component and resolve its effective type after any redeclare
  const childElements = (element as LongClass).getChildElements?.() ?? [];
  const cfgComponent = childElements.find(
    (c) => c.elementType === "component_clause" && (c as Component).name === "cfg",
  ) as Component | undefined;
  const redeclareMod = (element as LongClass).mods?.find(
    (m) => m.name === "cfg" && m.redeclare,
  );
  const configuration = redeclareMod?.redeclare ?? cfgComponent?.type ?? "";

  return {
    modelicaPath: className,
    configuration,
    columns,
    cells: [], // Empty cells - to be filled at UI runtime
  };
}

/**
 * Builds a modifier map from a component's mod.mods for propagation into nested records.
 * Maps local param name (e.g. "typ") -> overriding value (Expression or Literal).
 * Merges with any inherited map passed from the parent scope.
 */
function buildModifierMap(
  mod: Modification | null | undefined,
  inherited: ModifierMap,
): ModifierMap {
  const map: ModifierMap = new Map(inherited);
  if (!mod?.mods) return map;
  for (const nestedMod of mod.mods) {
    if (nestedMod.value !== undefined && nestedMod.name) {
      map.set(nestedMod.name, nestedMod.value);
    }
  }
  return map;
}

type ModifierMap = Map<string, Expression | Literal>;

/**
 * Recursively substitutes any string operand in an Expression that matches a
 * key in the modifier map with the corresponding value.
 * Also prepends the instance prefix to operands whose root name appears in
 * the set of known local instance names (localNames).
 */
function applyModifiers(
  value: Expression | Literal,
  modMap: ModifierMap,
  instancePrefix: string,
  localNames: Set<string>,
): Expression | Literal {
  if (typeof value !== "object" || value === null) {
    // Plain literal — if it's a string reference in the mod map, substitute
    if (typeof value === "string") {
      // Check top-level name (e.g. "typ") and dotted first segment (e.g. "cfg" in "cfg.typCoiCoo")
      const topName = value.split(".")[0];
      if (modMap.has(value)) {
        return modMap.get(value)!;
      }
      if (modMap.has(topName)) {
        // e.g. "cfg.typCoiCoo" with map key "cfg" -> substitute cfg part
        const replacement = modMap.get(topName)!;
        const rest = value.slice(topName.length + 1);
        if (rest && typeof replacement === "string") {
          return `${replacement}.${rest}`;
        }
        return replacement;
      }
      // Only prepend instance prefix for operands whose root name is a known
      // local component name in the enclosing record scope.
      if (
        instancePrefix &&
        localNames.has(topName) &&
        !value.startsWith(instancePrefix)
      ) {
        return `${instancePrefix}.${value}`;
      }
    }
    return value;
  }
  // Expression object — recurse into operands
  return {
    operator: (value as Expression).operator,
    operands: (value as Expression).operands.map((op) =>
      applyModifiers(op, modMap, instancePrefix, localNames),
    ),
  };
}

/**
 * Rebase a component's modelicaPath from its type root to the instance path.
 * e.g. component.modelicaPath = "Buildings.Templates.Components.Data.Coil.mAir_flow_nominal"
 *      typeRootPath           = "Buildings.Templates.Components.Data.Coil"
 *      instancePath           = "coiCoo"
 *   -> "coiCoo.mAir_flow_nominal"
 */
function rebasePath(
  modelicaPath: string,
  typeRootPath: string,
  instancePath: string,
): string {
  if (modelicaPath.startsWith(typeRootPath + ".")) {
    return instancePath + modelicaPath.slice(typeRootPath.length);
  }
  return modelicaPath;
}

/**
 * Recursively builds columns from a record, traversing both inheritance and
 * composition trees.
 *
 * @param element       - The record type definition to traverse
 * @param instancePath  - The dotted instance path relative to the top-level record
 *                        (e.g. "coiCoo" or "coiCoo.dat"). Used to rebase keys.
 * @param modMap        - Modifier overrides propagated from parent declarations
 *                        (e.g. coiCoo(typ=cfg.typCoiCoo) produces {typ -> cfg.typCoiCoo})
 */
function buildColumnsFromElement(
  element: Element,
  instancePath = "",
  modMap: ModifierMap = new Map(),
): Column[] {
  const columns: Column[] = [];
  const groupedColumns = new Map<string, Column[]>(); // group/tab name -> columns

  // Merge this element's extends mods (non-redeclare, value-bearing) into the modMap
  // so that e.g. `extends Parent(x=someValue)` overrides are visible to all child columns.
  for (const mod of (element as LongClass).mods ?? []) {
    if (
      mod.value !== undefined &&
      mod.name &&
      !mod.redeclare &&
      !modMap.has(mod.name)
    ) {
      modMap.set(mod.name, mod.value);
    }
  }

  // Get all child elements (includes inherited elements)
  const childElements =
    element.elementType === "record"
      ? (element as LongClass).getChildElements()
      : [];

  // Build the set of local component names so applyModifiers can discriminate
  // which expression operands are local references (and should be prefixed with
  // instancePath) vs. absolute type paths / numeric literals.
  const localNames = new Set<string>(
    childElements
      .filter((c) => c.elementType === "component_clause")
      .map((c) => (c as Component).name)
      .filter(Boolean),
  );

  for (const child of childElements) {
    // Skip non-component elements
    if (child.elementType !== "component_clause") {
      continue;
    }

    const component = child as Component;

    // Skip outer, final, or invisible parameters
    if (component.outer || component.final || component.deadEnd) {
      continue;
    }

    // Build the key as a relative path from the top-level record.
    // For nested records, rebasePath strips the type-root prefix and replaces it
    // with the instance path. For top-level components (instancePath="") and for
    // inherited components whose modelicaPath is rooted at a parent class (not
    // element.modelicaPath), we fall back to using component.name directly so
    // the key is always a short relative name, never an absolute type path.
    const rebasedName = instancePath
      ? rebasePath(component.modelicaPath, element.modelicaPath, instancePath)
      : component.name;
    // If rebasePath couldn't strip the type prefix (inherited component from a
    // parent class), fall back to composing the key from component.name directly.
    const key = rebasedName.startsWith(instancePath)
      ? rebasedName
      : instancePath
        ? `${instancePath}.${component.name}`
        : component.name;

    // Check if this component is redeclared in the current element's extends mods.
    // e.g. VAVMultiZone extends PartialAirHandler(redeclare VAVMultiZoneController ctl(...))
    // stores a Modification with name="ctl", redeclare="...VAVMultiZoneController" in element.mods.
    const redeclareMod = (element as LongClass).mods?.find(
      (m) => m.name === component.name && m.redeclare,
    );
    const effectiveTypePath = redeclareMod?.redeclare ?? component.type;

    // Determine if this is a predefined (leaf) type or a record (group) type
    const isPredefinedType = MLS_PREDEFINED_TYPES.includes(effectiveTypePath);
    const componentType = typeStore.get(effectiveTypePath);
    const isRecordType =
      componentType && componentType.elementType === "record";

    let column: Column;

    if (isPredefinedType || !isRecordType) {
      // Create a leaf column for predefined types and non-record types
      const attributes = extractAttributes(
        component,
        element,
        modMap,
        instancePath,
        localNames,
      );
      column = {
        kind: "leaf",
        key,
        label: component.description || component.name,
        ...attributes,
      };
    } else {
      // Build the nested instance path and inherit/merge modifiers from this component.
      // If there's a redeclare, also merge its nested mods (e.g. ctl(typSecOut=cfg.typSecOut)).
      const nestedInstancePath = instancePath
        ? `${instancePath}.${component.name}`
        : component.name;
      let nestedModMap = buildModifierMap(component.mod, modMap);
      if (redeclareMod?.mods?.length) {
        nestedModMap = buildModifierMap(redeclareMod, nestedModMap);
      }

      // Create a group column for record types, recursing with context
      const recordColumns = buildColumnsFromElement(
        componentType,
        nestedInstancePath,
        nestedModMap,
      );
      const groupAttributes = extractAttributes(
        component,
        element,
        modMap,
        instancePath,
        localNames,
      );
      column = {
        kind: "group",
        label: component.description || component.name,
        children: recordColumns,
        ...(groupAttributes.enable !== undefined && {
          enable: groupAttributes.enable,
        }),
      };
    }

    // Group by tab or group annotation if present
    const groupKey = component.tab || component.group;
    if (groupKey) {
      if (!groupedColumns.has(groupKey)) {
        groupedColumns.set(groupKey, []);
      }
      groupedColumns.get(groupKey)!.push(column);
    } else {
      columns.push(column);
    }
  }

  // Add grouped columns as GroupColumn entries
  for (const [groupLabel, groupChildren] of groupedColumns.entries()) {
    columns.push({
      kind: "group",
      label: groupLabel,
      children: groupChildren,
    });
  }

  return columns;
}

/**
 * Extracts unit, displayUnit, min, max, start, enable attributes from a component.
 * For non-predefined types, walks up the inheritance chain if attributes are missing.
 * Applies modMap substitutions and rebases references to instancePrefix.
 *
 * @param localNames - Set of local component names in the enclosing record scope,
 *                     used to safely discriminate which expression operands should
 *                     be prefixed with instancePrefix.
 */
function extractAttributes(
  component: Component,
  element: Element,
  modMap: ModifierMap = new Map(),
  instancePrefix = "",
  localNames: Set<string> = new Set(),
): {
  value?: number | string | boolean | Expression;
  final?: boolean;
  unit?: string;
  displayUnit?: string;
  min?: number | Expression;
  max?: number | Expression;
  start?: number | Expression;
  enable?: boolean | Expression;
} {
  const result: {
    value?: number | string | boolean | Expression;
    final?: boolean;
    unit?: string;
    displayUnit?: string;
    min?: number | Expression;
    max?: number | Expression;
    start?: number | Expression;
    enable?: boolean | Expression;
  } = {};

  // enable: __ctrlFlow.enable=false overrides Dialog.enable; otherwise use Dialog.enable
  const ctrlFlowEnable = component.getLinkageKeywordValue();
  if (ctrlFlowEnable === false) {
    result.enable = false;
  } else if (component.enable !== undefined && component.enable !== true) {
    result.enable = applyModifiersToAttr(
      component.enable,
      modMap,
      instancePrefix,
      localNames,
    );
  }

  // value: check modMap first (parent override), then component's own declaration binding.
  // A modMap entry for component.name means an enclosing record has set this parameter.
  const modMapValue = modMap.get(component.name);
  const rawValue = modMapValue !== undefined ? modMapValue : component.value;
  if (rawValue !== undefined) {
    result.value = applyModifiersToAttr(
      rawValue,
      modMap,
      instancePrefix,
      localNames,
    );
  }

  // final: true if component.mod is marked final, or if a modifier in element.mods
  // targets this component with final=true (e.g. extends Foo(final x=1)).
  const parentFinalMod = (element as LongClass).mods?.find(
    (m) => m.name === component.name && m.final,
  );
  if (component.mod?.final || parentFinalMod) {
    result.final = true;
  }

  const isPredefinedType = MLS_PREDEFINED_TYPES.includes(component.type);
  const isReal = component.type === "Real";

  // Only retrieve quantity attributes for Real types or non-predefined types
  if (!isReal && isPredefinedType) {
    return result;
  }

  // First try to get attributes from the type's TemplateInput modifiers
  const typeElement = typeStore.get(component.type);
  if (typeElement && !isPredefinedType) {
    const typeInputs = typeElement.getInputs({}, false);
    const typeInput = typeInputs[component.type];
    if (typeInput && typeInput.modifiers) {
      extractFromTemplateInputModifiers(
        component.modelicaPath,
        typeInput.modifiers,
        result,
      );
    }
  }

  // Also check component's own modifiers
  if (component.mod) {
    extractAttributesFromModifiers(
      component.modelicaPath,
      component.mod,
      result,
    );
  }

  // If type is not predefined and any attributes are still missing, walk up the
  // type chain until all attributes are found or no parent remains.
  if (!isPredefinedType && typeElement) {
    let current: Element | undefined = typeElement;
    while (current) {
      if (
        result.unit !== undefined &&
        result.displayUnit !== undefined &&
        result.min !== undefined &&
        result.max !== undefined &&
        result.start !== undefined
      ) {
        break;
      }
      if ("mods" in current && (current as any).mods) {
        const parentResult: typeof result = {};
        extractAttributesFromModifiers(
          current.modelicaPath,
          { mods: (current as any).mods },
          parentResult,
        );
        result.unit = result.unit ?? parentResult.unit;
        result.displayUnit = result.displayUnit ?? parentResult.displayUnit;
        result.min = result.min ?? parentResult.min;
        result.max = result.max ?? parentResult.max;
        result.start = result.start ?? parentResult.start;
      }
      current = nextInTypeChain(current);
    }
  }

  // Apply modifier substitutions to numeric/expression attributes
  if (result.min !== undefined) {
    result.min = applyModifiersToAttr(
      result.min,
      modMap,
      instancePrefix,
      localNames,
    );
  }
  if (result.max !== undefined) {
    result.max = applyModifiersToAttr(
      result.max,
      modMap,
      instancePrefix,
      localNames,
    );
  }
  if (result.start !== undefined) {
    result.start = applyModifiersToAttr(
      result.start,
      modMap,
      instancePrefix,
      localNames,
    );
  }

  return result;
}

/**
 * Applies modifier substitutions to an attribute value (literal or Expression).
 */
function applyModifiersToAttr(
  value: any,
  modMap: ModifierMap,
  instancePrefix: string,
  localNames: Set<string>,
): any {
  if (typeof value !== "object") {
    return value;
  }
  return applyModifiers(
    value as Expression,
    modMap,
    instancePrefix,
    localNames,
  );
}

/**
 * Unwraps a mod value which may be a raw Literal or an Expression object.
 * - If the value reduces to a scalar literal, returns it directly.
 * - If it is a complex Expression that cannot be reduced, returns the Expression
 *   so the client can evaluate it at runtime.
 * - Returns undefined for null/undefined values.
 */
function resolveModValue(
  value: any,
): string | number | boolean | Expression | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value !== "object") {
    return value as string | number | boolean;
  }
  // Expression object — try to reduce to a literal
  const evaluated = evaluateExpression(value as Expression);
  if (evaluated === null) {
    return undefined;
  }
  // Return the literal if simple, otherwise keep the full Expression for client eval
  return evaluated as string | number | boolean | Expression;
}

/**
 * Extracts attributes from a component's modification object
 */
function extractAttributesFromModifiers(
  modelicaPath: string,
  mod: any,
  result: {
    unit?: string;
    displayUnit?: string;
    min?: number | Expression;
    max?: number | Expression;
    start?: number | Expression;
  },
): void {
  if (!mod || !mod.mods) {
    return;
  }

  // Look through nested modifiers for attribute modifiers
  for (const nestedMod of mod.mods) {
    const modPath = nestedMod.modelicaPath || "";
    const raw = resolveModValue(nestedMod.value);

    if (
      modPath.endsWith(".unit") &&
      raw !== undefined &&
      typeof raw !== "object"
    ) {
      result.unit = String(raw);
    } else if (
      modPath.endsWith(".displayUnit") &&
      raw !== undefined &&
      typeof raw !== "object"
    ) {
      result.displayUnit = String(raw);
    } else if (modPath.endsWith(".min") && raw !== undefined) {
      result.min = typeof raw === "object" ? raw : Number(raw);
    } else if (modPath.endsWith(".max") && raw !== undefined) {
      result.max = typeof raw === "object" ? raw : Number(raw);
    } else if (modPath.endsWith(".start") && raw !== undefined) {
      result.start = typeof raw === "object" ? raw : Number(raw);
    }
  }
}

/**
 * Extracts attributes from a TemplateInput's modifiers array
 */
function extractFromTemplateInputModifiers(
  modelicaPath: string,
  modifiers: any[],
  result: {
    unit?: string;
    displayUnit?: string;
    min?: number | Expression;
    max?: number | Expression;
    start?: number | Expression;
  },
): void {
  if (!modifiers || !Array.isArray(modifiers)) {
    return;
  }

  // Iterate through the modifiers array
  for (const mod of modifiers) {
    if (!mod || !mod.mods || !Array.isArray(mod.mods)) {
      continue;
    }

    // Look through nested modifiers for attribute modifiers
    for (const nestedMod of mod.mods) {
      const modPath = nestedMod.modelicaPath || "";
      const raw = resolveModValue(nestedMod.value);

      if (
        modPath.endsWith(".unit") &&
        raw !== undefined &&
        typeof raw !== "object"
      ) {
        result.unit = String(raw);
      } else if (
        modPath.endsWith(".displayUnit") &&
        raw !== undefined &&
        typeof raw !== "object"
      ) {
        result.displayUnit = String(raw);
      } else if (modPath.endsWith(".min") && raw !== undefined) {
        result.min = typeof raw === "object" ? raw : Number(raw);
      } else if (modPath.endsWith(".max") && raw !== undefined) {
        result.max = typeof raw === "object" ? raw : Number(raw);
      } else if (modPath.endsWith(".start") && raw !== undefined) {
        result.start = typeof raw === "object" ? raw : Number(raw);
      }
    }
  }
}

/**
 * Returns the next element in the type chain:
 * - LongClass: follows extendElement (explicit extends clause)
 * - ShortClass: follows the aliased type (e.g. PressureDifference -> Pressure -> Real)
 * - stops at predefined MLS types
 */
function nextInTypeChain(current: Element): Element | undefined {
  if (current instanceof LongClass) {
    return current.extendElement;
  }
  if (current instanceof ShortClass) {
    const aliasedType = current.type;
    if (
      aliasedType &&
      aliasedType !== current.modelicaPath &&
      !MLS_PREDEFINED_TYPES.includes(aliasedType)
    ) {
      return typeStore.get(aliasedType) ?? undefined;
    }
  }
  return undefined;
}
