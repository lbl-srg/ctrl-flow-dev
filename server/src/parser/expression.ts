// TODO: Move all types/interfaces that will be shared with the frontend to a common directory as an type/interface
// TODO: Fix any typing unless it is necessary for the any typing
// TODO: Clean up Literal typing
// export type Literal =
//   | { type: 'boolean', value: boolean }
//   | { type: 'string', value: string }
//   | { type: 'reference', value: string } // reference might not be the best name, but something like "Types.IceCream.Chocolate"
//   | { type: 'number', value: number } // are all the numbers integers? floats? do we need to distinguish?

// TODO: take in to account absolute paths (convert relative to absolute)
import { typeStore } from "./parser";

export type Literal = boolean | string | number;

// TODO: Clean up other Expression types in other files as they are not correct anymore
export type Expression = {
  operator: string;
  operands: Array<Literal | Expression>;
};

function buildArithmeticExpression(
  expression: any,
  operator: any,
  basePath: string,
  baseType: string,
): Expression {
  // TODO: attempt to expand operands as types
  const arithmetic_expression: Expression = {
    operator: operator === "<>" ? "!=" : operator,
    operands: [expression[0].name, expression[1].name],
  };

  // arithmetic_expression.operands = arithmetic_expression.operands.map((o, i) => {
  //   // if (typeof o === "string") {
  //   //   // left hand side of expression is most likely a variable reference - favor basePath first
  //   //   const element = (i === 0) ? typeStore.get(o, basePath) || typeStore.get(o, baseType)
  //   //     : typeStore.get(o, baseType) || typeStore.get(o, basePath);
  //   //   return (element) ? element.modelicaPath : o;
  //   // }
  //   return o;
  // });

  return arithmetic_expression;
}

function buildLogicalExpression(
  expression: any,
  basePath: string,
  baseType: string,
): Expression {
  const logical_expression: Expression = {
    operator: "bad_logical_expression",
    operands: ["unknown_logical_expression"],
  };

  if (expression.arithmetic_expressions) {
    return buildArithmeticExpression(
      expression.arithmetic_expressions,
      expression.relation_operator,
      basePath,
      baseType,
    );
  }

  if (expression.logical_or?.length === 1) {
    return buildLogicalExpression(expression.logical_or[0], basePath, baseType);
  }

  if (expression.logical_and?.length === 1) {
    return buildLogicalExpression(
      expression.logical_and[0],
      basePath,
      baseType,
    );
  }

  if (expression.logical_or?.length > 1) {
    return {
      operator: "||",
      operands: expression.logical_or.map((element: any) =>
        buildLogicalExpression(element, basePath, baseType),
      ),
    };
  }

  if (expression.logical_and?.length > 1) {
    return {
      operator: "&&",
      operands: expression.logical_and.map((element: any) =>
        buildLogicalExpression(element, basePath, baseType),
      ),
    };
  }

  return logical_expression;
}

function buildLoopConditionExpression(expression: any): Expression {
  const loop_condition_expression: Expression = {
    operator: "loop_condition",
    operands: [expression.name, expression.range],
  };

  return loop_condition_expression;
}

function buildForLoopExpression(
  expression: any,
  basePath: string,
  baseType: string,
): Expression {
  const for_loop_expression: Expression = {
    operator: "for",
    operands: expression.for_loop?.map((loop_condition_expression: any) => {
      return buildLoopConditionExpression(loop_condition_expression);
    }),
  };

  for_loop_expression.operands.push(
    getExpression(expression.expression, basePath, baseType),
  );

  return for_loop_expression;
}

function buildFunctionExpression(
  expression: any,
  basePath: string,
  baseType: string,
): Expression {
  const function_expression: Expression = {
    operator: expression.name,
    operands: expression.arguments?.map((argument_expression: any) => {
      return getExpression(expression.name, basePath, baseType);
    }),
  };

  return function_expression;
}

function buildFunctionCallExpression(
  expression: any,
  basePath: string,
  baseType: string,
): Expression {
  const function_call_expression: Expression = {
    operator: "function_call",
    operands: [buildFunctionExpression(expression, basePath, baseType)],
  };

  return function_call_expression;
}

function buildIfArrayExpression(
  expression: any,
  basePath: string,
  baseType: string,
): Expression {
  const if_array_expression: Expression = {
    operator: "if_array",
    operands: expression?.map((expression: any) =>
      buildIfExpression(expression, basePath, baseType),
    ),
  };

  return if_array_expression;
}

function buildConditionExpression(
  expression: any,
  index: number,
  basePath: string,
  baseType: string,
): Expression {
  const condition_expression: Expression = {
    operator: index === 0 ? "if" : "else_if",
    operands: [
      getExpression(expression.condition, basePath),
      getExpression(expression.then, basePath),
    ],
  };

  return condition_expression;
}

function buildElseExpression(expression: any, basePath: string): Expression {
  const else_expression: Expression = {
    operator: "else",
    operands: [getExpression(expression, basePath)],
  };

  return else_expression;
}

function buildIfExpression(
  expression: any,
  basePath: string,
  baseType: string,
): Expression {
  const if_expression: Expression = {
    operator: "if_elseif",
    operands: expression.if_elseif?.map(
      (condition_expression: any, index: number) => {
        return buildConditionExpression(
          condition_expression,
          index,
          basePath,
          baseType,
        );
      },
    ),
  };

  if_expression.operands.push(
    buildElseExpression(
      expression.else_expression || expression.else,
      basePath,
    ),
  );

  return if_expression;
}

function buildSimpleExpression(
  expression: any,
  basePath: string,
  baseType: string,
): Expression {
  let operand = expression;

  if (typeof expression === "object")
    console.log("Unknown Expression: ", expression);
  if (typeof expression === "string") {
    try {
      operand = JSON.parse(expression as string);
    } catch {
      /** deserialization failed */
    }
    if (typeof operand === "string") {
      // Attempt to expand operand as a type
      const element =
        typeStore.get(operand, basePath) || typeStore.get(operand, baseType); // TODO: may only need to check basePath
      operand = element ? element.modelicaPath : operand;
    }
  }

  const simple_expression: Expression = {
    operator: "none",
    operands: [operand],
  };

  return simple_expression;
}

export function evaluateExpression(expression: Expression): any {
  // (BE) If expression operator isn't none just return the expression
  // TODO: If expression operand is path should we keep as expression or just return the path?
  return expression.operator === "none" ? expression.operands[0] : expression;

  // Buildings.Templates.Data.AllSystems.stdEne
}

export function getExpression(
  value: any,
  basePath = "",
  baseType = "",
): Expression {
  const simple_expression = value?.simple_expression;
  const logical_expression =
    simple_expression?.logical_expression || value?.logical_expression;
  const for_loop_expression = simple_expression?.for_loop || value?.for_loop;
  const function_call_expression =
    simple_expression?.function_call || value?.function_call;
  const if_expression =
    simple_expression?.if_expression || value?.if_expression;

  if (logical_expression)
    return buildLogicalExpression(logical_expression, basePath, baseType);

  if (for_loop_expression)
    return buildForLoopExpression(for_loop_expression, basePath, baseType);

  if (function_call_expression)
    return buildFunctionCallExpression(
      function_call_expression,
      basePath,
      baseType,
    );

  if (if_expression && Array.isArray(if_expression))
    return buildIfArrayExpression(if_expression, basePath, baseType);

  if (if_expression)
    return buildIfExpression(if_expression, basePath, baseType);

  return buildSimpleExpression(simple_expression || value, basePath, baseType);
}
