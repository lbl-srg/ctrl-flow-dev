import { storeHooks } from "./store-helpers";

export type Literal = boolean | string | number;

export type Expression = {
  operator: string;
  operands: Array<Literal | Expression>;
}

export const MODELICA_LITERALS = ["String", "Boolean", "Real", "Integer"];

function resolveWithScope(path: string, selections: any, scopeList: string[], allOptions: any): any {
  const splitPath = path.split(".");
  const item = splitPath.pop();
  let value = null;

  scopeList.every((scope) => {
    let newPath = scope;

    splitPath.every((accessor) => {
      newPath = `${newPath}.${accessor}`;
      const option = allOptions.find((option: any) => option.modelicaPath === newPath);
      const type = option?.type;
      const modifiers = option?.modifiers;
      const typeIsLiteral = MODELICA_LITERALS.includes(type);

      if (type && !typeIsLiteral) {
        const typePath = `${type}.${item}`;
        const modifierValue = modifiers?.[typePath]?.expression;
        const typeOption = allOptions.find((option: any) => option.modelicaPath === typePath);
        const typeValue = typeOption?.modifiers?.[typePath]?.expression;

        if (modifierValue) {
          if (isExpression(modifierValue)) {
            value = evaluateExpression(modifierValue, selections, typeOption?.scopeList, allOptions);
            return false;
          }
          value = resolveValue(modifierValue, selections, typeOption?.scopeList, allOptions);
          return false;
        }

        if (typeValue) {
          if (isExpression(typeValue)) {
            value = evaluateExpression(typeValue, selections, typeOption?.scopeList, allOptions);
            return false;
          }
          value = resolveValue(typeValue, selections, typeOption?.scopeList, allOptions);
          return false;
        }
      }
      return true;
    });
    return true;
  });

  return value;
}

function resolveValue(path: string, selections: any, scopeList: string[], allOptions: any): any {
  const option = allOptions.find((option: any) => option.modelicaPath === path);
  const optionValue = option?.modifiers?.[path]?.expression;
  const optionIsDefinition = option?.definition;
  const selectionValue = selections[path];
  const selectionIsDefinition = allOptions.find((option: any) => option.modelicaPath === selectionValue);

  if (optionIsDefinition) return path;

  if (selectionValue && selectionIsDefinition) return selectionValue;

  if (optionValue) {
    if (isExpression(optionValue)) {
      return evaluateExpression(optionValue, selections, scopeList, allOptions);
    }
    return resolveValue(optionValue, selections, scopeList, allOptions);
  }

  // find option based on scopeList

  const scopeValue = resolveWithScope(path, selections, scopeList, allOptions);

  if (scopeValue) return scopeValue;

  return 'no_value';
}

function resolveExpression(expression: any, selections: any, scopeList: string[], allOptions: any): any {
  let resolved_expression: any = expression;

  expression.operands.every((operand: any, index: number) => {
    if (typeof operand !== 'string') return true;

    const resolvedValue = resolveValue(operand, selections, scopeList, allOptions);

    if (resolvedValue === 'no_value') {
      resolved_expression = false;
      return false;
    }

    resolved_expression.operands[index] = resolvedValue;
    return true;
  });

  return resolved_expression;
}

function expressionEvaluator(expression: any, selections: any, scopeList: string[], allOptions: any): any {
  const resolved_expression = resolveExpression(expression, selections, scopeList, allOptions);
  
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

export function evaluateExpression(expression: any, selections: any, scopeList: string[], allOptions: any): any {
  //TODO: (FE) If operand is a path to a value look up path, if the value isn't known return the expression

  const evaluated_expression: any = expression;

  // if both operands are not expressions evaluate the current expression
  // if any of the operands are expressions call evaluateExpression for that expression

  expression.operands.forEach((operand: any, index: number) => {
    if (isExpression(operand)) {
      evaluated_expression.operands[index] = evaluateExpression(operand, selections, scopeList, allOptions);
    }
  });

  return expressionEvaluator(evaluated_expression, selections, scopeList, allOptions);
}
