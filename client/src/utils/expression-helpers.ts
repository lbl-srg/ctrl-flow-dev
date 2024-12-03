import { deepCopy } from "./utils";
import { applyPathModifiers } from "./modifier-helpers";
import { OptionInterface } from "../data/template";

export type Literal = boolean | string | number;

export type Expression = {
  operator: string;
  operands: Array<Literal | Expression>;
};

export function resolveValue(
  value: boolean | number | string,
  scope: string,
  selectionPath: string,
  selections: any,
  modifiers: any,
  pathModifiers: any,
  allOptions: { [key: string]: OptionInterface },
): any {
  let selectionValue = undefined;
  let scopeModifier = undefined;
  let newScope = undefined;

  if (selectionPath) {
    // We have a selectionPath that means value is not coming from inside an expression

    // This section checks if we have a selection to resolveValue
    // So we just check if we have the selection by using the selectionPath
    selectionValue = selections[selectionPath];

    // If we have a selection we just need to return the selection
    if (selectionValue !== undefined) return selectionValue;

    // If value is a boolean or number we are just a value and need to return
    if (typeof value === "boolean" || typeof value === "number") return value;

    // This section checks if we have a modifier based on currentScope
    scopeModifier = modifiers[scope];

    // We adjust scope to evaluate an expression if needed
    // Set scope relative to class definition by popping off what is assumed to be a param name
    newScope = scope.split(".").slice(0, -1).join(".");
  } else if (typeof value === 'string') {
    // Since we don't have a selectionPath that means value is coming from inside an expression,
    // So if value is a string we need to do the following logic

    // This section checks if we have a selection to resolveValue
    // We need to determine if value is a modelicaPath or an instancePath,
    // Below tests if a selection exists based on if value is a modelicaPath
    const splitScopePath = scope.split('.');

    while(splitScopePath.length > 0) {
      const testPath = splitScopePath.join(".");
      const valueSelectionPath: any = testPath ? `${value}-${testPath}` : value;

      if (valueSelectionPath in selections) {
        selectionValue = selections[valueSelectionPath];
        break;
      }
      splitScopePath.pop();
    }

    // Below tests if a selection exists based on if value is an instancePath
    if (selectionValue === undefined) {
      const selectionKeys: string[] = Object.keys(selections);

      selectionKeys.every((key) => {
        if (key.includes(`-${value}`)) {
          selectionValue = selections[key];
          return false;
        }
        return true;
      });
    }

    // If we have a selection we just need to return the selection
    if (selectionValue !== undefined) return selectionValue;

    // This section checks if we have a pathModifier based on currentScope and value (value would be an instancePath)
    const modifiedPath = applyPathModifiers(`${scope}.${value}`, pathModifiers);

    // This section checks if we have a modifier using the modifiedPath or value or scope,
    // then we adjust scope to evaluate an expression if needed
    if (modifiedPath) {
      scopeModifier = modifiers[modifiedPath];
      // Set scope relative to class definition by popping off what is assumed to be a param name
      newScope = modifiedPath.split(".").slice(0, -1).join(".");
    } else {
      scopeModifier = modifiers[value];
      // Set scope relative to class definition by popping off what is assumed to be a param name
      newScope = value.split(".").slice(0, -1).join(".");
    }
  } else {
    // The value is a boolean or number so we just return it
    return value;
  }

  let evaluatedValue: any = undefined;

  // This section attempts to resolve the value by using a found modifier with an instancePath
  if (scopeModifier) {
    const scopeModExpression = deepCopy(scopeModifier.expression);
    evaluatedValue = evaluateExpression(
      scopeModExpression,
      newScope,
      selectionPath,
      selections,
      modifiers,
      pathModifiers,
      allOptions,
    );

    if (!isExpression(evaluatedValue)) return evaluatedValue;
  }

  // If we couldn't resolve a modifier get default value from option (using the modelica path 'value')
  const originalOption = allOptions[value];

  if (originalOption) {
    const originalValExpression = deepCopy(originalOption?.value);
    evaluatedValue = isExpression(originalOption?.value)
      ? evaluateExpression(
          originalValExpression,
          newScope,
          selectionPath,
          selections,
          modifiers,
          pathModifiers,
          allOptions,
        )
      : originalOption?.value;
  }

  if (evaluatedValue && !isExpression(evaluatedValue)) return evaluatedValue;

  // If the value can't be resolved we need to return this flag so we can return the whole expression that the value came from
  return "no_value";
}

function resolveExpression(
  expression: any,
  scope: string,
  selectionPath: string,
  selections: any,
  modifiers: any,
  pathModifiers: any,
  allOptions: { [key: string]: OptionInterface },
): any {
  let resolved_expression: any = expression;

  expression.operands.every((operand: any, index: number) => {
    const resolvedValue = resolveValue(
      operand,
      scope,
      selectionPath,
      selections,
      modifiers,
      pathModifiers,
      allOptions,
    );

    if (resolvedValue === "no_value") {
      resolved_expression = false;
      return false;
    }

    resolved_expression.operands[index] = resolvedValue;
    return true;
  });

  return resolved_expression;
}

function expressionEvaluator(
  expression: any,
  scope: string,
  selectionPath: string,
  selections: any,
  modifiers: any,
  pathModifiers: any,
  allOptions: { [key: string]: OptionInterface },
): any {
  const resolved_expression = resolveExpression(
    expression,
    scope,
    selectionPath,
    selections,
    modifiers,
    pathModifiers,
    allOptions,
  );

  if (resolved_expression === false) return expression;

  let parsed_expression: any;

  switch (expression.operator) {
    case "none":
      parsed_expression = resolved_expression.operands[0];
      break;
    case "<":
      parsed_expression =
        resolved_expression.operands[0] < resolved_expression.operands[1];
      break;
    case "<=":
      parsed_expression =
        resolved_expression.operands[0] <= resolved_expression.operands[1];
      break;
    case ">":
      parsed_expression =
        resolved_expression.operands[0] > resolved_expression.operands[1];
      break;
    case ">=":
      parsed_expression =
        resolved_expression.operands[0] >= resolved_expression.operands[1];
      break;
    case "==":
      parsed_expression =
        resolved_expression.operands[0] == resolved_expression.operands[1];
      break;
    case "!=":
      parsed_expression =
        resolved_expression.operands[0] != resolved_expression.operands[1];
      break;
    case "||":
      parsed_expression =
        resolved_expression.operands[0] || resolved_expression.operands[0];
      break;
    case "&&":
      parsed_expression =
        resolved_expression.operands[0] && resolved_expression.operands[0];
      break;
    // case 'if_array':
    case "if_elseif":
      expression.operands.every((condition: any) => {
        if (condition[0]) {
          parsed_expression = condition[1];
          return false;
        }
        return true;
      });
      break;
    case "if":
    case "else_if":
      parsed_expression = resolved_expression.operands[0]
        ? [true, resolved_expression.operands[1]]
        : [false];
      break;
    case "else":
      parsed_expression = [true, resolved_expression.operands[0]];
      break;
    // case 'for':
    // case 'loop_condition':
    // case 'function_call':
    // Determine how to do function call names (create list of potential functions that need to checked?)
    default:
      parsed_expression = resolved_expression;
      break;
  }

  return parsed_expression;
}

export function isExpression(item: any): boolean {
  return !!item?.operator;
}

export function evaluateExpression(
  expression: any,
  scope: string,
  selectionPath: string,
  selections: any,
  modifiers: any,
  pathModifiers: any,
  allOptions: { [key: string]: OptionInterface },
): any {
  const evaluated_expression: any = expression;

  expression.operands.forEach((operand: any, index: number) => {
    if (isExpression(operand)) {
      const nestedExpression = deepCopy(operand);
      evaluated_expression.operands[index] = evaluateExpression(
        nestedExpression,
        scope,
        selectionPath,
        selections,
        modifiers,
        pathModifiers,
        allOptions,
      );
    }
  });

  return expressionEvaluator(
    evaluated_expression,
    scope,
    selectionPath,
    selections,
    modifiers,
    pathModifiers,
    allOptions,
  );
}
