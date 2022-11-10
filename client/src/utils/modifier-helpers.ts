import { OptionInterface } from "../data/template";
import { FlatConfigOption } from "../components/steps/Configs/SlideOut";
import { evaluateExpression, isExpression } from "./expression-helpers";

export const MODELICA_LITERALS = ["String", "Boolean", "Real", "Integer"];

// TODO: Create Modifiers interface shape

export function buildModifiers(
  modifiers: any,
  scope: string,
  flatModifiers: any,
): any {
  let newModifiers = {};

  Object.keys(modifiers)?.forEach((modifier) => {
    const instance = modifier.split(".").pop() || "";
    const instancePath: string = scope ? `${scope}.${instance}` : instance;
    newModifiers = {
      ...newModifiers,
      [instancePath]: modifiers[modifier],
    };
  });

  return {
    ...flatModifiers,
    ...newModifiers,
  };
}

export function applyValueModifiers(
  configOption: FlatConfigOption,
  scopePath: string,
  selectionPath: string,
  selections: any,
  modifiers: any,
  allOptions: any,
): any {
  const selection = selections[selectionPath];
  const selectionIsDefinition = allOptions.find((option: any) => option.modelicaPath === selection)?.definition || false;
  const scopeModifier = modifiers[scopePath]; 
  const originalOption = allOptions.find((option: any) => option.modelicaPath === configOption.modelicaPath);

  const scope = scopePath.split('.').slice(0, -1).join('.');
  let evaluatedValue: any = undefined;

  // handle selection, if a selection exists that needs to be value
  if (selection !== null && selection !== undefined && typeof selection !== 'string') return selection;
  if (selection && selectionIsDefinition) return selection;

  // apply modifiers if able
  if (scopeModifier) {
    evaluatedValue = isExpression(scopeModifier?.expression) ?
      evaluateExpression(
        scopeModifier.expression,
        scope,
        selectionPath,
        selections,
        modifiers,
        allOptions
      ) : scopeModifier.expression;
  }
  
  // if modifier didn't fully resolve try default value of original option
  if (!evaluatedValue || isExpression(evaluatedValue)) {
    evaluatedValue = isExpression(originalOption?.value) ?
      evaluateExpression(
        originalOption?.value,
        scope,
        selectionPath,
        selections,
        modifiers,
        allOptions
      ) : originalOption?.value;
  }

  // return evaluatedValue if it has fully resolved otherwise return null
  return evaluatedValue && !isExpression(evaluatedValue) ? evaluatedValue : null;
}

// creates object of modifications (old mods, new mods, type mods, selections???)
// might need to figure out how initial selections will be affected, might need to do that here instead
// any modification with expression needs to be evaluated

// export function getModifierContext(
//   currentOption: OptionInterface,
//   modifiers: any,
//   // selectedModifiers: any,
//   allOptions: any
// ): any {
//   // Checking if our type is a Modelica Literal instead of a modelicaPath
//   const typeIsLiteral = MODELICA_LITERALS.includes(currentOption.type);
//   let typeModifiers: any = {};

//   // Seeing if we have a different type than the current options modelicaPath, if so we need to grab the modifiers of the type
//   if (!typeIsLiteral && currentOption.type !== currentOption.modelicaPath) {
//     typeModifiers = allOptions.find((option: any) => option.modelicaPath === currentOption?.type)?.modifiers || {};
//   }

//   // Merging all modfiers together for the current option, this will also be passed down the tree to childOptions
//   // TODO: Add selection modifiers, also evaluating expressions
//   return {
//     ...modifiers,
//     ...currentOption.modifiers,
//     ...typeModifiers,
//     // ...selectedModifiers,
//   };
// }

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