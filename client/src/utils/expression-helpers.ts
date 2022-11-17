import { storeHooks } from "./store-helpers";
import { Modifiers, applyPathModifiers } from "./modifier-helpers";
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
  const selectionValue = selections[selectionPath];

  // if we have a selection we just need to return the selection (I don't think we need to test the selection)
  if (selectionValue !== undefined) return selectionValue;

  // if value is a boolean or number we are just a value and need to return
  if (typeof value === "boolean" || typeof value === "number") return value;

  // need to check if there is a modifier
  const scopePath = applyPathModifiers(`${scope}.${value}`, pathModifiers);
  const scopeModifier = modifiers[scopePath];
  const newScope = scopePath.split(".").slice(0, -1).join(".");
  let evaluatedValue: any = undefined;

  if (scopeModifier) {
    evaluatedValue = evaluateExpression(
      scopeModifier.expression,
      newScope,
      selectionPath,
      selections,
      modifiers,
      pathModifiers,
      allOptions,
    );

    if (!isExpression(evaluatedValue)) return evaluatedValue;
  }

  // if we couldn't resolve a modifier we need to check for a default value
  const originalOption = allOptions[value];

  if (originalOption) {
    evaluatedValue = isExpression(originalOption?.value)
      ? evaluateExpression(
          originalOption?.value,
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

  // if the value can't be resolved we need to return this flag so we can return the whole expression that the value came from
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
      evaluated_expression.operands[index] = evaluateExpression(
        operand,
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
