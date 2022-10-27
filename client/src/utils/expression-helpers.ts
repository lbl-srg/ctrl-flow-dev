import { storeHooks } from "./store-helpers";

export type Literal = boolean | string | number;

export type Expression = {
  operator: string;
  operands: Array<Literal | Expression>;
}

function resolveValue(path: string, selections: any): any {
  const { getTemplateOption } = storeHooks();
  const option = getTemplateOption(path);
  const isDefinition = option?.definition;
  const selectionValue = selections[path];
  const optionValue = option?.modifiers?.[path]?.expression;

  if (!option || isDefinition) return path;

  if (selectionValue) return selectionValue;

  if (optionValue) {
    if (isExpression(optionValue)) {
      return evaluateExpression(optionValue, selections);
    }
    return resolveValue(optionValue, selections);
  }

  return 'no_value';
}

function resolveExpression(expression: any, selections: any): any {
  let resolved_expression: any = expression;

  expression.operands.every((operand: any, index: number) => {
    if (typeof operand !== 'string') return true;

    const resolvedValue = resolveValue(operand, selections);

    if (resolvedValue === 'no_value') {
      resolved_expression = false;
      return false;
    }

    resolved_expression.operands[index] = resolvedValue;
    return true;
  });

  return resolved_expression;
}

function expressionEvaluator(expression: any, selections: any): any {
  const resolved_expression = resolveExpression(expression, selections);
  
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

export function evaluateExpression(expression: any, selections: any): any {
  //TODO: (FE) If operand is a path to a value look up path, if the value isn't known return the expression
  
  const evaluated_expression: any = expression;

  // if both operands are not expressions evaluate the current expression
  // if any of the operands are expressions call evaluateExpression for that expression

  expression.operands.forEach((operand: any, index: number) => {
    if (isExpression(operand)) {
      evaluated_expression.operands[index] = evaluateExpression(operand, selections);
    }
  });

  return expressionEvaluator(evaluated_expression, selections);
}
