///////////////// Context Mapper: Maps a ConfigContext to a configuration page DisplayList

import { OptionInterface } from "../../src/data/template";

import {
  ConfigContext,
  OptionInstance,
  constructSelectionPath,
} from "./interpreter";

export interface FlatConfigOptionGroup {
  groupName: string;
  selectionPath: string;
  items: DisplayItem[];
}

export interface FlatConfigOption {
  parentModelicaPath: string;
  modelicaPath: string;
  name: string;
  choices?: OptionInterface[];
  booleanChoices?: string[];
  value: any;
  scope: string;
  selectionType: string;
}

type DisplayItem = FlatConfigOptionGroup | FlatConfigOption;

export const MLS_PREDEFINED_TYPES_TO_NOT_DISPLAY = [
  "String",
  "Real",
  "Integer",
];

const displayOptionFilter = (
  optionInstance: OptionInstance,
  optionType: string,
) => {
  return (
    optionType.startsWith("Modelica") ||
    MLS_PREDEFINED_TYPES_TO_NOT_DISPLAY.includes(optionType) ||
    optionInstance.instancePath.endsWith("dat")
  );
};

/**
 * Maps an OptionInstance to a a display option - handles booleans and dropdowns
 */
export function _formatDisplayOption(
  optionInstance: OptionInstance,
  parentModelicaPath: string,
  context: ConfigContext,
): FlatConfigOption {
  const option = optionInstance.option;
  const type = optionInstance.option.type === "Boolean" ? "Boolean" : "Normal";

  const flatOptionSetup: Partial<FlatConfigOption> = {
    parentModelicaPath,
    modelicaPath: option.modelicaPath,
    name: option.name,
    value: optionInstance.value?.toString(),
    selectionType: type,
    scope: optionInstance.instancePath,
  };

  if (type === "Boolean") {
    return {
      ...flatOptionSetup,
      booleanChoices: ["true", "false"],
    } as FlatConfigOption;
  } else {
    // assume 'Normal'' format
    // map options to child options
    return {
      ...flatOptionSetup,
      choices: option?.options?.map(
        (o) => context.options[o],
      ) as OptionInterface[],
    } as FlatConfigOption;
  }
}

/**
 * Formats a displayGroup. This returns null if it is a group
 * with no child items
 *
 * paramInstance is the parameter that uses the type being used to generate the group
 *
 * e.g.
 *
 * GroupType myParam
 *
 * GroupType is passed in as the option
 * myParam is the param instance of the type
 */
export function _formatDisplayGroup(
  option: OptionInterface,
  paramInstance: OptionInstance,
  context: ConfigContext,
) {
  const instancePath = `${paramInstance.instancePath}.__group`;
  const selectionPath = constructSelectionPath(
    option.modelicaPath,
    instancePath,
  );
  // `option.options` lists the parameters declared in the class itself first,
  // followed by the inherited parameters. Modelica tools display inherited
  // parameters first, starting with the deepest class in the inheritance tree:
  // reorder by declaring class, from the last treeList entry (deepest base
  // class) to the first (the class itself).
  const treeList = option.treeList ?? [];
  const declaringClassRank = (path: string) =>
    treeList.indexOf(path.split(".").slice(0, -1).join("."));
  const orderedOptions = [...(option.options ?? [])].sort(
    (a, b) => declaringClassRank(b) - declaringClassRank(a),
  );

  // Parameters are laid out following the Dialog annotation of their
  // declaration: parameters with no tab/group annotation are displayed
  // headerless at the top, followed by the Dialog tabs and groups in order
  // of first occurrence. The UI has no tab widget so tabs are rendered as
  // groups enclosing their Dialog groups. Grouping is applied to the
  // flattened, sorted parameter list so that identical group names merge
  // across the inheritance hierarchy. Groups resulting from model
  // composition (nested composite components) are never merged into Dialog
  // groups: they keep their own nesting level, inside their Dialog group if
  // their declaration is annotated.
  const ungroupedItems: DisplayItem[] = [];
  const groupedItems: DisplayItem[] = [];
  const dialogContainers: { [key: string]: FlatConfigOptionGroup } = {};

  const dialogContainer = (tab: string, group: string): DisplayItem[] => {
    if (!tab && !group) {
      return ungroupedItems;
    }
    const key = `${tab}|${group}`;
    let container = dialogContainers[key];
    if (!container) {
      container = {
        groupName: group || tab,
        selectionPath: constructSelectionPath(
          option.modelicaPath,
          `${paramInstance.instancePath}.__dialog.${key}`,
        ),
        items: [],
      };
      dialogContainers[key] = container;
      const parentItems =
        group && tab ? dialogContainer(tab, "") : groupedItems;
      parentItems.push(container);
    }
    return container.items;
  };

  orderedOptions.forEach((o) => {
    const childOption = context.options[o];
    // Register the Dialog container at the parameter's position even if the
    // parameter itself is not displayed (e.g. hidden by a final assignment
    // in a derived class): Modelica tools order tabs and groups by the
    // position of the first parameter declared with the annotation, whether
    // that parameter is displayed or not.
    const tab = typeof childOption.tab === "string" ? childOption.tab : "";
    const group =
      typeof childOption.group === "string" ? childOption.group : "";
    const containerItems = dialogContainer(tab, group);
    let childItems: DisplayItem[];
    // Long class definitions with child options form a "group" of inputs in the configuration panel
    if (
      childOption.definition &&
      !childOption.shortExclType &&
      childOption?.options?.length
    ) {
      const childGroup = _formatDisplayGroup(
        childOption,
        paramInstance,
        context,
      );
      childItems = childGroup ? [childGroup] : [];
    } else {
      const paramName = o.split(".").pop();
      const childInstancePath = [paramInstance.instancePath, paramName]
        .filter((p) => p !== "")
        .join(".");
      const oInstance = context.getOptionInstance(childInstancePath);
      childItems = oInstance
        ? _formatDisplayItem(oInstance, option.modelicaPath, context)
        : [];
    }
    if (childItems.length) {
      containerItems.push(...childItems);
    }
  });

  // Dialog containers whose parameters are all hidden are not displayed
  const pruneEmptyContainers = (items: DisplayItem[]): DisplayItem[] =>
    items.filter((item) => {
      if ("groupName" in item) {
        item.items = pruneEmptyContainers(item.items);
        return item.items.length > 0;
      }
      return true;
    });

  const mappedItems = [
    ...ungroupedItems,
    ...pruneEmptyContainers(groupedItems),
  ];

  const group =
    mappedItems && mappedItems.length
      ? {
          groupName: paramInstance.option.name as string,
          selectionPath,
          items: mappedItems,
        }
      : null;

  return group;
}

/**
 * Recursive method that handles traversal of OptionInstances and generates
 * the appropriate groups and options
 */
export function _formatDisplayItem(
  optionInstance: OptionInstance,
  parentModelicaPath: string,
  context: ConfigContext,
): DisplayItem[] {
  // picks if we are rendering a single instance
  // or a group
  const option = optionInstance.option;
  if (!option) {
    return [];
  }
  const displayList: DisplayItem[] = [];
  const optionType = option.type;

  if (displayOptionFilter(optionInstance, optionType as string)) {
    return [];
  }

  if (optionInstance.display) {
    // 1. Add an option instance
    displayList.push(
      _formatDisplayOption(optionInstance, parentModelicaPath, context),
    );
  }
  // check if the type needs to be rendered
  // Use optionInstance.value for type lookup:
  // - For non-replaceable components with no binding (value is undefined), lookup fails -> no nested components rendered
  // - For replaceable components with no binding (value is undefined), use option.type instead
  const type =
    option["replaceable"] && !optionInstance.value
      ? option.type
      : optionInstance.value;
  const typeOption = context.options[type as string];
  if (typeOption === undefined) {
    return displayList;
  }

  if (
    !optionInstance.isOuter &&
    typeOption.definition &&
    !typeOption.shortExclType &&
    typeOption.options?.length
  ) {
    const displayGroup = _formatDisplayGroup(
      typeOption,
      optionInstance,
      context,
    );
    if (displayGroup) {
      displayList.push(displayGroup);
    }
  }

  return displayList;
}

// Maps a current context into a list of displayable options
export function mapToDisplayOptions(context: ConfigContext) {
  const rootInstance = context.getRootInstance();
  // run twice to get a few more values resolved
  // only way to be sure is to count the number of resolved values
  // and keep running until that number doesn't change
  _formatDisplayItem(rootInstance, "", context);
  return _formatDisplayItem(rootInstance, "", context);
}
