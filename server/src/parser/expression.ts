// export type Literal =
//   | { type: 'boolean', value: boolean } 
//   | { type: 'string', value: string }
//   | { type: 'reference', value: string } // reference might not be the best name, but something like "Types.IceCream.Chocolate" 
//   | { type: 'number', value: number } // are all the numbers integers? floats? do we need to distinguish?

export type Literal = boolean | string | number;

export type Expression = {
  operator: string;
  operands: Array<Literal | Expression>;
}

function buildArithmeticExpression(expression: any): Expression {
  const arithmetic_expression: Expression = {
    operator: expression.relation_operator,
    operands: [expression[0].name, expression[1].name]
  };

  return arithmetic_expression;
}

function buildLogicalExpression(expression: any): Expression {
  const logical_expression: Expression = {
    operator: 'bad_logical_expression',
    operands: ['unknown_logical_expression']
  };

  if (expression?.arithmetic_expressions) {
    return buildArithmeticExpression(expression.arithmetic_expressions);
  }

  if (expression?.logical_or && expression.logical_or.length <= 1) {
    return buildLogicalExpression(expression.logical_or[0]);
  }

  if (expression?.logical_and && expression.logical_and.length <= 1) {
    return buildLogicalExpression(expression.logical_and[0]);
  }

  if (expression?.logical_or && expression.logical_or.length > 1) {
    return {
      operator: 'or',
      operands: expression.logical_or.map((element: any) => buildLogicalExpression(element))
    }
  }

  if (expression?.logical_and && expression.logical_and.length > 1) {
    return {
      operator: 'and',
      operands: expression.logical_and.map((element: any) => buildLogicalExpression(element))
    }
  }

  return logical_expression;
}

function buildSimpleExpression(expression: any): Expression {
  const simple_expression: Expression = {
    operator: 'none',
    operands: [expression]
  };

  return simple_expression;
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
  let if_expression: Expression = {
    operator: 'if_elseif',
    operands: []
  };

  if (expression?.if_elseif) {
    if_expression.operands.push(expression.if_elseif.map(
      (condition_expression: any, index: number) => buildConditionExpression(condition_expression, index)
    ));
  }

  if (expression?.else_expression) {
    if_expression.operands.push(buildElseExpression(expression.else_expression));
  }

  return if_expression;
}

export function getExpression(value: any): Expression {
  const simple_expression = value?.simple_expression;
  const logical_expression = simple_expression?.logical_expression || null;
  const if_expression = value?.if_expression;

  const expression: Expression = {
    operator: 'other_expression',
    operands: ['some_other_expression']
  };

  if (logical_expression) return buildLogicalExpression(logical_expression);

  if (simple_expression) return buildSimpleExpression(simple_expression);

  if (if_expression) return buildIfExpression(if_expression);
  
  return expression;
}
