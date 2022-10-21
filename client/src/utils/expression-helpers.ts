export type Literal = boolean | string | number;

export type Expression = {
  operator: string;
  operands: Array<Literal | Expression>;
}

// TODO: reslove path function
// path priority selection, mods, options

// function resolveModelicaPath(path: string): any {
//   // look up path to see if it is a definition
//   // if definition return path

//   // check selections for path and value
//   // check options for path and get value (possibly from modification expression)

//   // return value
//   return path;
// }

// TODO: MAYBE? Move to Common Directory as a helper (potentially need 2 helpers 1 front-end and 1 back-end)
// pass mods as well

function expressionEvaluator(expression: any): any {
  let parsed_expression: any;

  switch (expression.operator) {
    case 'none':
      // TODO: Include FE function that resolves paths if path is in operand.
      // If path doesn't resolve to a value return expression
      parsed_expression = expression.operands[0];
      break;
    case '<':
      // TODO: Include FE function that resolves paths if path is in operand.
      // If path doesn't resolve to a value return expression
      parsed_expression = expression.operands[0] < expression.operands[1];
      break;
    case '<=':
      // TODO: Include FE function that resolves paths if path is in operand.
      // If path doesn't resolve to a value return expression
      parsed_expression = expression.operands[0] <= expression.operands[1];
      break;
    case '>':
      // TODO: Include FE function that resolves paths if path is in operand.
      // If path doesn't resolve to a value return expression
      parsed_expression = expression.operands[0] > expression.operands[1];
      break;
    case '>=':
      // TODO: Include FE function that resolves paths if path is in operand.
      // If path doesn't resolve to a value return expression
      parsed_expression = expression.operands[0] >= expression.operands[1];
      break;
    case '==':
      // TODO: Include FE function that resolves paths if path is in operand.
      // If path doesn't resolve to a value return expression
      parsed_expression = expression.operands[0] == expression.operands[1];
      break;
    case '!=':
      // TODO: Include FE function that resolves paths if path is in operand.
      // If path doesn't resolve to a value return expression
      parsed_expression = expression.operands[0] != expression.operands[1];
      break;
    case '||':
      // TODO: Include FE function that resolves paths if path is in operand.
      // If path doesn't resolve to a value return expression
      parsed_expression = expression.operands[0] || expression.operands[0];
      break;
    case '&&':
      // TODO: Include FE function that resolves paths if path is in operand.
      // If path doesn't resolve to a value return expression
      parsed_expression = expression.operands[0] && expression.operands[0];
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
      // TODO: Include FE function that resolves paths if path is in operand.
      // If path doesn't resolve to a value return expression
      parsed_expression = expression.operands[0] ? [true, expression.operands[1]] : [false];
      break;
    case 'else':
      // TODO: Include FE function that resolves paths if path is in operand.
      // If path doesn't resolve to a value return expression
      parsed_expression = [true, expression.operands[0]];
      break;   
    // case 'for':
    // case 'loop_condition':
    // case 'function_call':
      // Determine how to do function call names (create list of potential functions that need to checked?)
    default:
      parsed_expression = expression;
      break;
  }

  return parsed_expression;
}

export function evaluateExpression(expression: any): any {
  //TODO: (FE) If operand is a path to a value look up path, if the value isn't known return the expression
  
  let evaluated_expression: any = expression;

  // if both operands are not expressions evaluate the current expression
  // if any of the operands are expressions call evaluateExpression for that expression

  expression.operands.forEach((operand: any, index: number) => {
    if (operand?.operator) {
      evaluated_expression.operands[index] = evaluateExpression(operand);
    }
  });

  return expressionEvaluator(evaluated_expression);
}
