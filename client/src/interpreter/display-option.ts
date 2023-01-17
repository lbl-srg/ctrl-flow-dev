///////////////// Context Mapper: Maps a ConfigContext to a configuration page DisplayList

import Template, {
  TemplateInterface,
  OptionInterface,
} from "../../src/data/template";

import {
  ConfigContext,
  OptionInstance,
  constructSelectionPath,
} from "./interpreter";

type DisplayItem = FlatConfigOptionGroup | FlatConfigOption;
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

export interface FlatConfigOptionChoice {
  modelicaPath: string;
  name: string;
}

/**
 * Maps an OptionInstance to a a display option - handles booleans and dropdowns
 * @param optionInstance
 * @param parentModelicaPath
 * @param scope
 */
export function _formatDisplayOption(
  optionInstance: OptionInstance,
  parentModelicaPath: string,
  context: ConfigContext,
): FlatConfigOption {
  const option = optionInstance.option;
  const type = optionInstance.option.type === "Boolean" ? "Boolean" : "Normal";

  let flatOptionSetup: Partial<FlatConfigOption> = {
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
  // TODO: optionInstance for definitions? Not sure what happens here
  // this 'path' should never be used. It does need to be a unique ID though. Previous instance
  // path + group?
  const instancePath = `${paramInstance.instancePath}.__group`;
  const selectionPath = constructSelectionPath(
    option.modelicaPath,
    instancePath,
  );
  const mappedItems = option.options
    ?.flatMap((o) => {
      // TODO: an option can be a definition - _formatDisplayItem should do the right thing
      // also: how to step building bad paths
      const childOption = context.options[o];
      if (childOption.definition && childOption?.options?.length) {
        // definitions do not have an instance path
        return _formatDisplayGroup(childOption, paramInstance, context);
      } else {
        const paramName = o.split(".").pop();
        const childInstancePath = `${paramInstance.instancePath}.${paramName}`;
        if (childInstancePath === "secOutRel.secOut.SingleDamper") {
          console.log("stop");
        }
        const oInstance = context.getOptionInstance(childInstancePath);
        const oOptions = oInstance
          ? _formatDisplayItem(oInstance, option.modelicaPath, context)
          : null;
        return oOptions;
      }
    })
    .filter((displayOption) => !!displayOption) as DisplayItem[];

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
 * @param optionInstance
 * @param parentModelicaPath
 * @param context
 * @returns
 */
export function _formatDisplayItem(
  optionInstance: OptionInstance,
  parentModelicaPath: string,
  context: ConfigContext,
): DisplayItem[] {
  // picks if we are rendering a single instance
  // or a group
  const option = optionInstance.option;
  const displayList: DisplayItem[] = [];
  const optionType =
    option.replaceable && optionInstance.value !== undefined
      ? optionInstance.value
      : option.type;

  if (
    context.template.scheduleOptionPaths.find((p) => p === option.modelicaPath)
  ) {
    // this is a 'dat' entry point. Don't grab anything from these nodes
    return [];
  }

  if (optionInstance.display) {
    // 1. Add an option instance
    displayList.push(
      _formatDisplayOption(optionInstance, parentModelicaPath, context),
    );
    // check if there is a selection, if so render it
    // if (option.replaceable && optionInstance.value !== undefined) {
    //   const redeclaredType = context.options[optionInstance.value as string];

    //   // format redeclared/selected group
    //   if (redeclaredType) {
    //     const displayGroup = _formatDisplayGroup(
    //       redeclaredType,
    //       optionInstance,
    //       context,
    //     );
    //     if (displayGroup) {
    //       // 2. Add the result of a redeclare
    //       displayList.push(displayGroup);
    //     }
    //   }
    // }
  }
  // check if we render type
  const type =
    optionInstance.value !== undefined ? optionInstance.value : option.type;
  const typeOption = context.options[type as string];
  if (typeOption === undefined) {
    return displayList;
  }
  // typeOption should always be a definition
  if (typeOption.definition && typeOption.options?.length) {
    const displayGroup = _formatDisplayGroup(
      typeOption,
      optionInstance,
      context,
    );
    if (displayGroup) {
      displayList.push(displayGroup);
    }
  }

  // check if group
  // if (option.options?.length) {
  //   const displayGroup = _formatDisplayGroup(option, optionInstance, context);
  //   // iterate through children
  //   if (displayGroup) {
  //     displayList.push(displayGroup);
  //   }
  // }

  return displayList;
}

// Maps a current context into a list of displayable options
export function mapToDisplayOptions(context: ConfigContext) {
  const rootInstance = context.getRootInstance();
  return _formatDisplayItem(rootInstance, "", context);
}
