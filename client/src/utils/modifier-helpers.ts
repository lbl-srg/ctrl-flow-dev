import { OptionInterface } from "../data/template";
import { FlatConfigOption } from "../components/steps/Configs/SlideOut";
import { Expression, evaluateExpression, isExpression, resolveValue } from "./expression-helpers";

export type Modifiers = {
  [key: string]: Expression
};

function addToModObject(
  newModifiers: Modifiers,
  baseInstancePath: string,
  modifiers: Modifiers,
  options: OptionInterface[],
  recursive = true,
) {
  Object.entries(newModifiers).forEach(([k, expression]) => {
    const instanceName = k.split(".").pop();
    const modKey = [baseInstancePath, instanceName]
      .filter((segment) => segment !== "")
      .join(".");

    // Do not add a key that is already present. The assumption is that
    // the first time an instance path is present is the most up-to-date
    if (!(modKey in modifiers)) {
      modifiers[modKey] = expression;
    }

    if (recursive) {
      // grab modifiers from original definition
      const modOption = options.find(
        (o) => o.modelicaPath === k,
      ) as OptionInterface;
      if (modOption?.modifiers) {
        addToModObject(newModifiers, baseInstancePath, modifiers, options, false);
      }
    }
  });
};

// recursive helper method
export function updateModifiers(
  option: OptionInterface,
  baseInstancePath: string,
  modifiers: Modifiers,
  options: OptionInterface[],
) {
  if (option === undefined) {
    return; // TODO: not sure this should be allowed - failing with 'Medium'
  }
  const optionModifiers = option.modifiers as Modifiers;
  const childOptions = option.options;

  // grab the current options modifiers
  if (optionModifiers) {
    addToModObject(optionModifiers, baseInstancePath, modifiers, options);
  }

  // if this is a definition - visit all child options and grab modifiers
  if (childOptions) {
    const name = option.modelicaPath.split(".").pop();
    const newBase = option.definition
      ? baseInstancePath
      : [baseInstancePath, name].filter((p) => p !== "").join(".");

    if (option.definition) {
      childOptions.map((path) => {
        const childOption = options.find(
          (o) => o.modelicaPath === path,
        ) as OptionInterface;

        updateModifiers(childOption, newBase, modifiers, options);
      });
    } else {
      // this is a parameter (either replaceable or enum) - grab the type and its modifiers
      // only use the 'type', not child options to fetch modifiers (default options)
      const typeOption = options.find((o) => o.modelicaPath === option.type);
      if (typeOption && typeOption.options) {
        // add modifiers from type option
        if (typeOption.modifiers) {
          addToModObject(typeOption.modifiers, newBase, modifiers, options);
        }
        typeOption.options.map((path) => {
          const childOption = options.find(
            (o) => o.modelicaPath === path,
          ) as OptionInterface;

          updateModifiers(childOption, newBase, modifiers, options);
        });
      }
    }
  }
};

export function buildModifiers(
  startOption: OptionInterface,
  options: OptionInterface[],
): Modifiers {
  const modifiers: Modifiers = {};

  updateModifiers(startOption, "", modifiers, options);

  return modifiers;
};

export function applyValueModifiers(
  configOption: FlatConfigOption,
  scope: string,
  selectionPath: string,
  selections: any,
  modifiers: any,
  allOptions: any,
): any {
  let evaluatedValue: any = undefined;

  if (!isExpression(configOption?.value)) {
    evaluatedValue = resolveValue(
      configOption?.value,
      scope,
      selectionPath,
      selections,
      modifiers,
      allOptions
    );

    // return evaluatedValue if it has fully resolved otherwise return null
    return evaluatedValue !== 'no_value' ? evaluatedValue : null;
  }

  evaluatedValue = evaluateExpression(
    configOption?.value,
    scope,
    selectionPath,
    selections,
    modifiers,
    allOptions
  );

  // return evaluatedValue if it has fully resolved otherwise return null
  return !isExpression(evaluatedValue) ? evaluatedValue : null;
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