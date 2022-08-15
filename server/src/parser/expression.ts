// TODO: Move all types/interfaces that will be shared with the frontend to a common directory as an type/interface
// TODO: Fix any typing unless it is necessary for the any typing
// TODO: Clean up Literal typing
// export type Literal =
//   | { type: 'boolean', value: boolean } 
//   | { type: 'string', value: string }
//   | { type: 'reference', value: string } // reference might not be the best name, but something like "Types.IceCream.Chocolate" 
//   | { type: 'number', value: number } // are all the numbers integers? floats? do we need to distinguish?

export type Literal = boolean | string | number;

// TODO: Clean up other Expression types in other files as they are not correct anymore
export type Expression = {
  operator: string;
  operands: Array<Literal | Expression>;
}

function buildArithmeticExpression(expression: any, operator: any): Expression {
  const arithmetic_expression: Expression = {
    operator: operator === '<>' ? '!=' : operator,
    operands: [expression[0].name, expression[1].name]
  };

  return arithmetic_expression;
}

function buildLogicalExpression(expression: any): Expression {
  const logical_expression: Expression = {
    operator: 'bad_logical_expression',
    operands: ['unknown_logical_expression']
  };

  if (expression.arithmetic_expressions) {
    return buildArithmeticExpression(expression.arithmetic_expressions, expression.relation_operator);
  }

  if (expression.logical_or?.length === 1) {
    return buildLogicalExpression(expression.logical_or[0]);
  }

  if (expression.logical_and?.length === 1) {
    return buildLogicalExpression(expression.logical_and[0]);
  }

  if (expression.logical_or?.length > 1) {
    return {
      operator: '||',
      operands: expression.logical_or.map((element: any) => buildLogicalExpression(element))
    }
  }

  if (expression.logical_and?.length > 1) {
    return {
      operator: '&&',
      operands: expression.logical_and.map((element: any) => buildLogicalExpression(element))
    }
  }

  return logical_expression;
}

function buildLoopConditionExpression(expression: any): Expression {
  const loop_condition_expression: Expression = {
    operator: 'loop_condition',
    operands: [expression.name, expression.range]
  };

  return loop_condition_expression;
}

function buildForLoopExpression(expression: any): Expression {
  const for_loop_expression: Expression = {
    operator: 'for',
    operands: [
      expression.for_loop?.map((loop_condition_expression: any) => {
        return buildLoopConditionExpression(loop_condition_expression);
      }),
      getExpression(expression.expression)
    ]
  };

  return for_loop_expression;
}

function buildArgumentExpression(expression: any): Expression {
  const argument_expression: Expression = {
    operator: 'argument',
    operands: [getExpression(expression.name)]
  };

  return argument_expression;
}

function buildFunctionCallExpression(expression: any): Expression {
  const function_call_expression: Expression = {
    operator: 'function_call',
    operands: [
      expression.name,
      expression.arguments?.map((argument_expression: any) => {
        return buildArgumentExpression(argument_expression);
      })
    ]
  };

  return function_call_expression;
}

function buildIfArrayExpression(expression: any): Expression {
  const if_array_expression: Expression = {
    operator: 'if_array',
    operands: expression?.map((expression: any) => buildIfExpression(expression))
  };

  return if_array_expression;
}

function buildConditionExpression(expression: any, index: number): Expression {
  const condition_expression: Expression = {
    operator: index === 0 ? 'if' : 'else_if',
    operands: [getExpression(expression.condition), getExpression(expression.then)]
  }

  return condition_expression;
}

function buildElseExpression(expression: any): Expression {
  const else_expression: Expression = {
    operator: 'else',
    operands: [getExpression(expression)]
  }

  return else_expression;
}

function buildIfExpression(expression: any): Expression {
  const if_expression: Expression = {
    operator: 'if_elseif',
    operands: [
      expression.if_elseif?.map((condition_expression: any, index: number) => {
        return buildConditionExpression(condition_expression, index);
      }),
      buildElseExpression(expression.else_expression || expression.else)
    ]
  };

  return if_expression;
}

function buildSimpleExpression(expression: any): Expression {
  const simple_expression: Expression = {
    operator: 'none',
    operands: [expression]
  };

  if (typeof expression === 'object') console.log("Unknown Expression: ", expression);

  return simple_expression;
}

// TODO: Move to Common Directory as a helper
export function evaluateExpression(expression: Expression): any {
  let parsed_expression: any = 'case not setup';

  switch (expression.operator) {
    case 'none':
      // Try to deserialize the operand
      try {
        parsed_expression = JSON.parse(expression.operands[0] as string);
      } catch {
        parsed_expression = expression.operands[0];
      }
      break;
    // case '<':
    // case '<=':
    // case '>':
    // case '>=':
    // case '==':
    // case '!=':
    //   parsed_expression = `${expression.operands[0]} ${expression.operator} ${expression.operands[1]}`;
    //   break;
    // case '||':
    // case '&&':
    //   parsed_expression = `${evaluateExpression(expression.operands[0])} ${expression.operator} ${evaluateExpression(expression.operands[1])}`;
    //   break;
    // case 'if_elseif':
    // case 'if':
    // case 'else_if':
    // case 'else':
    // case 'for':
    // case 'loop_condition':
    // case 'function_call':
    // case 'argument':
    default:
      break;
  }

  return parsed_expression;
}

export function getExpression(value: any): Expression {
  const simple_expression = value.simple_expression;
  const logical_expression = simple_expression?.logical_expression || value.logical_expression;
  const for_loop_expression = simple_expression?.for_loop || value.for_loop;
  const function_call_expression = simple_expression?.function_call || value.function_call;
  const if_expression = simple_expression?.if_expression || value.if_expression;

  if (logical_expression) return buildLogicalExpression(logical_expression);

  if (for_loop_expression) return buildForLoopExpression(for_loop_expression);

  if (function_call_expression) return buildFunctionCallExpression(function_call_expression);

  if (if_expression && Array.isArray(if_expression)) return buildIfArrayExpression(if_expression);
  
  if (if_expression) return buildIfExpression(if_expression);

  return buildSimpleExpression(simple_expression || value);
}
