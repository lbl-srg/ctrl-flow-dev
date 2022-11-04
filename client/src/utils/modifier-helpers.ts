import { OptionInterface } from "../data/template";
import { FlatConfigOption } from "../components/steps/Configs/SlideOut";
import {
  evaluateExpression,
  isExpression,
  Expression,
} from "./expression-helpers";
import { ModifierFlags } from "typescript";

export const MODELICA_LITERALS = ["String", "Boolean", "Real", "Integer"];

// TODO: Create Modifiers interface shape

// creates object of modifications (old mods, new mods, type mods, selections???)
// might need to figure out how initial selections will be affected, might need to do that here instead
// any modification with expression needs to be evaluated

// fanSupDra.typ.nextParam.a
/**
 *
 * For a modifier instance path, returns the type of the last param
 *
 */
function getTypePath(
  path: string,
  option: OptionInterface,
  defaultScopeList: string[],
  allOptions: { [key: string]: OptionInterface },
) {
  const pathList = path.split(".");
  let scopeList = defaultScopeList;
  let typePath = "";

  // walk through definitions to find correct expanded path
  while (pathList.length > 1) {
    const prefix = pathList.shift();
    for (const scope of scopeList) {
      const baseOption = allOptions[`${scope}.${prefix}`];
      if (baseOption) {
        scopeList = baseOption.scopeList;
        break;
      }
    }
  }

  scopeList.map((scope) => {
    const curPath = `${scope}.${pathList[-1]}`;
    if (Object.hasOwn(allOptions, curPath)) {
      typePath = curPath;
    }
  });

  return typePath;
}

export function getValue(
  path: string,
  currentOption: OptionInterface,
  allOptions: { [key: string]: OptionInterface },
): Expression | any {
  const scopeList = currentOption.scopeList;

  // Resolving a value Example:
  // fanSupDra.firstClass.secondClass.name
  // find 'fanSupDra' option
  // check if 'fanSupDra' has a modifier path of 'firstClass.secondClass.name'
  // it does not, go to the 'firstClass' definition by looking up the type of fanSupDra, then getting the option for 'firstClass'
  // check if there is a modifier with path 'secondClass.name'
  // it does not, go to the 'secondClass' definition by looking up type of 'firstClass', then getting the option for secondCLass
  // get option for <type of second class> + name
  // return this value;
  // keep going until you end up at the original type definition of the 'name' parameter in the 'secondClass' type definition
}

export function getModifierContext(
  currentOption: OptionInterface,
  modifiers: any,
  // selectedModifiers: any,
  allOptions: any,
): any {
  // Checking if our type is a Modelica Literal instead of a modelicaPath
  const typeIsLiteral = MODELICA_LITERALS.includes(currentOption.type);
  let typeModifiers: any = {};

  // Seeing if we have a different type than the current options modelicaPath, if so we need to grab the modifiers of the type
  if (!typeIsLiteral && currentOption.type !== currentOption.modelicaPath) {
    typeModifiers =
      allOptions.find(
        (option: any) => option.modelicaPath === currentOption?.type,
      )?.modifiers || {};
  }

  // Merging all modfiers together for the current option, this will also be passed down the tree to childOptions
  // TODO: Add selection modifiers, also evaluating expressions
  return {
    ...modifiers,
    ...currentOption.modifiers,
    ...typeModifiers,
    // ...selectedModifiers,
  };
}

// applies the modifiers from getModifierContext
// visible, enable, final, modifier value

// export function applyChoiceModifiers(
//   option: OptionInterface,
//   modifiers: any,
//   selections: any,
// ): OptionInterface[] {
//   // Setting up newChildren if the visiblity needs to be modified
//   const newOptions: OptionInterface[] = [];

//   // If we have an object of flattened Modifiers and we have children we need to modify those children's visiblilty
//   // if there is a modifier for the child
//   if (Object.keys(modifiers).length !== 0 && option.childOptions?.length) {
//     option.childOptions.forEach((child: any) => {
//       const newChild: OptionInterface = {...child};
//       const childModifier: any = modifiers[child.modelicaPath];

//       if (isExpression(newChild?.enable)) {
//         newChild.enable = evaluateExpression(newChild.enable, selections);

//         if (isExpression(newChild.enable)) {
//           newChild.enable = false;
//         }
//       }

//       if (childModifier && childModifier?.final !== undefined) {
//         newChild.visible = child?.visible && !childModifier.final;
//       }

//       // TODO: Remove this, it is a temporay hack
//       const hideArray = ['ASHRAE', 'Title 24'];
//       hideArray.forEach((condition) => {
//         if (newChild.name.includes(condition)) {
//           newChild.visible = false;
//         }
//       });

//       newChild.visible = newChild.visible && newChild.enable;

//       newOptions.push(newChild);
//     });
//   }

//   return newOptions.length ? newOptions : option.childOptions || [];
// }

// TODO: Apply expressions and store as selections for non-visiable items. Do we set items that are not enabled?

// grab default value, either by evaluating or selecting the first choice
export function applyValueModifiers(
  option: FlatConfigOption,
  // modifiers: any,
  // firstValue: any,
  selections: any,
  allOptions: any,
): string {
  const selection = selections[option.modelicaPath];
  // const modifier = modifiers[option.modelicaPath];
  const modifier = option.modifiers[option.modelicaPath];
  const isDefinition =
    allOptions.find((option: any) => option.modelicaPath === selection)
      ?.definition || false;
  let evaluatedValue: any;

  if (selection && isDefinition) return selection;

  if (isExpression(modifier?.expression)) {
    evaluatedValue = evaluateExpression(
      modifier.expression,
      selections,
      option.scopeList,
      allOptions,
    );
  }

  // return evaluatedValue && !isExpression(evaluatedValue) ? evaluatedValue : firstValue;
  return evaluatedValue && !isExpression(evaluatedValue)
    ? evaluatedValue
    : null;
}
