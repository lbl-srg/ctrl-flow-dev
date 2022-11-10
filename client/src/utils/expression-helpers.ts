import { storeHooks } from "./store-helpers";

export type Literal = boolean | string | number;

export type Expression = {
  operator: string;
  operands: Array<Literal | Expression>;
}

function resolveValue(
  path: string,
  scope: string,
  selectionPath: string,
  selections: any,
  modifiers: any,
  allOptions: any
): any {
  // path should be an instancePath or a modelicaPath
  // need to know modelicaPath to append to the path? Do I create the path from treeList?
  const scopePath = `${scope}.${path}`;

  const selectionValue = selections[selectionPath];
  const selectionIsDefinition = allOptions.find((option: any) => option.modelicaPath === selectionValue);
  const scopeModifier = modifiers[scopePath];
  const originalOption = allOptions.find((option: any) => option.modelicaPath === path);
  const optionIsDefinition = originalOption?.definition;

  const newScope = scopePath.split('.').slice(0, -1).join('.');

  let evaluatedValue: any = undefined;

  // if the originalOption is a definition it is the value we want (we are not an option that has choices?)
  if (optionIsDefinition) return path;

  // if we have a selection and the value is a definition we want to use that value
  if (selectionValue && selectionIsDefinition) return selectionValue;

  // evaluate scope modifier
  if (scopeModifier) {
    evaluatedValue = isExpression(scopeModifier?.expression) ?
      evaluateExpression(
        scopeModifier.expression,
        newScope,
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
        newScope,
        selectionPath,
        selections,
        modifiers,
        allOptions
      ) : originalOption?.value;
  }

  if (evaluatedValue && !isExpression(evaluatedValue)) {
    return resolveValue(
      evaluatedValue,
      newScope,
      selectionPath,
      selections,
      modifiers,
      allOptions
    );
  }

  return 'no_value';
}

function resolveExpression(
  expression: any,
  scope: string,
  selectionPath: string,
  selections: any,
  modifiers: any,
  allOptions: any
): any {
  let resolved_expression: any = expression;

  expression.operands.every((operand: any, index: number) => {
    if (typeof operand !== 'string') return true;

    const resolvedValue = resolveValue(
      operand,
      scope,
      selectionPath,
      selections,
      modifiers,
      allOptions
    );

    if (resolvedValue === 'no_value') {
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
  allOptions: any
): any {
  const resolved_expression = resolveExpression(
    expression,
    scope,
    selectionPath,
    selections,
    modifiers,
    allOptions
  );
  
  if (resolved_expression === false) return expression;

  let parsed_expression: any;

  switch (expression.operator) {
    case 'none':
      parsed_expression = resolved_expression.operands[0];
      break;
    case '<':
      parsed_expression = resolved_expression.operands[0] < resolved_expression.operands[1];
      break;
    case '<=':
      parsed_expression = resolved_expression.operands[0] <= resolved_expression.operands[1];
      break;
    case '>':
      parsed_expression = resolved_expression.operands[0] > resolved_expression.operands[1];
      break;
    case '>=':
      parsed_expression = resolved_expression.operands[0] >= resolved_expression.operands[1];
      break;
    case '==':
      parsed_expression = resolved_expression.operands[0] == resolved_expression.operands[1];
      break;
    case '!=':
      parsed_expression = resolved_expression.operands[0] != resolved_expression.operands[1];
      break;
    case '||':
      parsed_expression = resolved_expression.operands[0] || resolved_expression.operands[0];
      break;
    case '&&':
      parsed_expression = resolved_expression.operands[0] && resolved_expression.operands[0];
      break;
    // case 'if_array':
    case 'if_elseif':
      expression.operands.every((condition: any) => {
        if (condition[0]) {
          parsed_expression = condition[1];
          return false;
        }
        return true;
      });
      break;
    case 'if':
    case 'else_if':
      parsed_expression = resolved_expression.operands[0] ? [true, resolved_expression.operands[1]] : [false];
      break;
    case 'else':
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
  allOptions: any
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
        allOptions
      );
    }
  });

  return expressionEvaluator(
    evaluated_expression,
    scope,
    selectionPath,
    selections,
    modifiers,
    allOptions
  );
}
