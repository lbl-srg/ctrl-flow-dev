// function getOperator(operator_key: string): string {
//   return operator_key.replace('logical_', '');
// }

function buildExpression(logical_expression: any): Expression | Literal {
  if (logical_expression.arithmetic_expressions) {
    return `${logical_expression.arithmetic_expressions[0].name}${logical_expression.relation_operator}${logical_expression.arithmetic_expressions[1].name}`;
  }

  if (logical_expression.logical_or && logical_expression.logical_or.length <= 1) {
    return buildExpression(logical_expression.logical_or[0]);
  }

  if (logical_expression.logical_or && logical_expression.logical_or.length > 1) {
    return {
      operator: 'or',
      operands: logical_expression.logical_or.map((element: any) => buildExpression(element))
    }
  }

  if (logical_expression.logical_and && logical_expression.logical_and.length <= 1) {
    return buildExpression(logical_expression.logical_and[0]);
  }

  if (logical_expression.logical_and && logical_expression.logical_and.length > 1) {
    return {
      operator: 'and',
      operands: logical_expression.logical_and.map((element: any) => buildExpression(element))
    }
  }

  return 'none';
}

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

export function getExpression(value: any): Expression | Literal {
  const simple_expression = value.simple_expression;
  const logical_expression = simple_expression.logical_expression || null;
  let expression: Expression | Literal;

  if (!logical_expression) return simple_expression;

  expression = buildExpression(logical_expression);

  // console.log('logical_expression: ', expression);
  // expression.operands.forEach((element: any) => {
  //   console.log('element: ', element);
  //   console.log('element operator: ', element.operator);
  //   console.log('element operands: ', element.operands);
  // });

  return expression;
}
