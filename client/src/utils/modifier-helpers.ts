import { OptionInterface } from "../data/template";
import { storeHooks } from "./store-helpers";
import { evaluateExpression, isExpression } from "./expression-helpers";

export const MODELICA_LITERALS = ["String", "Boolean", "Real", "Integer"];

// TODO: Create Modifiers interface shape

// creates object of modifications (old mods, new mods, type mods, selections???)
// might need to figure out how initial selections will be affected, might need to do that here instead
// any modification with expression needs to be evaluated

export function getModifierContext(
  option: OptionInterface,
  modifiers: any,
  selections: any
): any {
  const { getTemplateOption } = storeHooks();
  // Checking if our type is a Modelica Literal instead of a modelicaPath
  const typeIsLiteral = MODELICA_LITERALS.includes(option.type);
  let typeModifiers: any = {};

  // Seeing if we have a different type than the current options modelicaPath, if so we need to grab the modifiers of the type
  if (!typeIsLiteral && option.type !== option.modelicaPath) {
    typeModifiers = getTemplateOption(option?.type)?.modifiers || {};
  }

  // Merging all modfiers together for the current option, this will also be passed down the tree to childOptions
  // TODO: Add selection modifiers, also evaluating expressions
  return {
    ...modifiers,
    ...option.modifiers,
    ...typeModifiers,
    ...selections,
  };
}

// applies the modifiers from getModifierContext
// visible, enable, final, modifier value

export function applyChoiceModifiers(
  option: OptionInterface,
  modifiers: any,
  selections: any,
): OptionInterface[] {
  // Setting up newChildren if the visiblity needs to be modified
  const newOptions: OptionInterface[] = [];

  // If we have an object of flattened Modifiers and we have children we need to modify those children's visiblilty
  // if there is a modifier for the child
  if (Object.keys(modifiers).length !== 0 && option.childOptions?.length) {
    option.childOptions.forEach((child: any) => {
      const newChild: OptionInterface = {...child};
      const childModifier: any = modifiers[child.modelicaPath];

      if (isExpression(newChild?.enable)) {
        newChild.enable = evaluateExpression(newChild.enable, selections);
        if (isExpression(newChild.enable)) {
          newChild.enable = false;
        }
      }

      if (childModifier && childModifier?.final !== undefined) {
        newChild.visible = child?.visible && !childModifier.final;
      }

      // TODO: Remove this, it is a temporay hack
      const hideArray = ['ASHRAE', 'Title 24'];
      hideArray.forEach((condition) => {
        if (newChild.name.includes(condition)) {
          newChild.visible = false;
        }
      });

      newChild.visible = newChild.visible && newChild.enable;

      newOptions.push(newChild);
    });
  }

  return newOptions.length ? newOptions : option.childOptions || [];
}

// TODO: Apply expressions and store as selections for non-visiable items. Do we set items that are not enabled?

// grab default value, either by evaluating or selecting the first choice
export function applyValueModifiers(
  option: OptionInterface,
  modifiers: any,
  firstValue: any,
  selections: any,
): string {
  const { isDefinition } = storeHooks();
  const selection = selections[option.modelicaPath];
  const modifier = modifiers[option.modelicaPath];
  let evaluatedValue: any;

  if (selection && isDefinition(selection)) return selection;

  if (isExpression(modifier?.expression)) {
    evaluatedValue = evaluateExpression(modifier.expression, selections);
  }

  return evaluatedValue && !isExpression(evaluatedValue) ? evaluatedValue : firstValue;
}