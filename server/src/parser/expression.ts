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

function expandStringOperand(
  operand: string,
  basePath: string,
  baseType: string,
): Literal | Expression {
  let myoperand = operand;
  try {
    myoperand = JSON.parse(operand as string);
  } catch {
    /** deserialization failed */
  }
  /*
   * After try and catch above:
   *   "Buildings.Type"      → "Buildings.Type"
   *   "\"String literal\""  → "String literal"
   *   "false"               → false
   * Only attempt to expand as a type if still a string, and original operand not literal
   */
  if (typeof myoperand === "string" && !/^".*"$/.test(operand)) {
    const element =
      typeStore.get(myoperand, basePath) || typeStore.get(myoperand, baseType);
    myoperand = element ? element.modelicaPath : myoperand;
  }
  return myoperand;
}

function buildArithmeticExpression(
  expression: any,
  operator: any,
  basePath: string,
  baseType: string,
): Expression {
  const arithmetic_expression: Expression = {
    operator: operator === "<>" ? "!=" : operator,
    operands: expression.map((operand: any) =>
      typeof operand === "string"
        ? expandStringOperand(operand, basePath, baseType)
        : getExpression(operand, basePath, baseType),
    ),
  };

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
    let result: Expression;
    // Single arithmetic_expression without relation_operator is a boolean reference
    if (
      expression.arithmetic_expressions.length === 1 &&
      !expression.relation_operator
    ) {
      result = buildSimpleExpression(
        expression.arithmetic_expressions[0],
        basePath,
        baseType,
      );
    } else {
      result = buildArithmeticExpression(
        expression.arithmetic_expressions,
        expression.relation_operator,
        basePath,
        baseType,
      );
    }
    // Include ! operator if "not": true
    if (expression.not) {
      return {
        operator: "!",
        operands: [result],
      };
    }
    return result;
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

function buildTermExpression(
  term: any,
  basePath: string,
  baseType: string,
): Expression {
  // A term can be a string literal, or an object with operators and factors
  if (typeof term === "string") {
    return buildSimpleExpression(term, basePath, baseType);
  }

  if (typeof term === "object" && term.factors) {
    // term: { operators: ["*", "/"], factors: [...] }
    // operators may be absent if there's only one factor
    // Build a nested expression for multiplication/division
    const factors = term.factors.map((factor: any) =>
      buildFactorExpression(factor, basePath, baseType),
    );

    if (factors.length === 1) {
      return factors[0];
    }

    // Build left-associative expression: ((a * b) / c)
    // Per grammar: term = factor { mul-operator factor }
    // So operators.length === factors.length - 1
    const operators: string[] = term.operators || [];
    let result = factors[0];
    for (let i = 0; i < operators.length; i++) {
      result = {
        operator: operators[i],
        operands: [result, factors[i + 1]],
      };
    }
    return result;
  }

  // Fallback: treat as simple expression
  return buildSimpleExpression(term, basePath, baseType);
}

function buildPrimaryExpression(
  primary: any,
  basePath: string,
  baseType: string,
): Expression {
  // primary can be a string or an array of expression objects
  // expression: { simple_expression?: ..., if_expression?: ... }
  if (typeof primary === "string") {
    return buildSimpleExpression(primary, basePath, baseType);
  }

  if (Array.isArray(primary)) {
    // Array of expression objects
    const expressions = primary.map((expr: any) => {
      // Each expr is an expression object with simple_expression and/or if_expression
      // Use getExpression which handles both cases
      return getExpression(expr, basePath, baseType);
    });

    if (expressions.length === 1) {
      return expressions[0];
    }

    // Multiple expressions - return as array expression
    return {
      operator: "primary_array",
      operands: expressions,
    };
  }

  // Single object - use getExpression to handle simple_expression or if_expression
  return getExpression(primary, basePath, baseType);
}

function buildFactorExpression(
  factor: any,
  basePath: string,
  baseType: string,
): Expression {
  // A factor can be:
  // - a string literal
  // - an object with { primary1, operator?, primary2? } for exponentiation
  if (typeof factor === "string") {
    return buildSimpleExpression(factor, basePath, baseType);
  }

  if (typeof factor === "object" && factor.primary1 !== undefined) {
    const primary1Expr = buildPrimaryExpression(
      factor.primary1,
      basePath,
      baseType,
    );

    // Check for exponentiation: { primary1, operator: "^" or ".^", primary2 }
    if (factor.operator && factor.primary2 !== undefined) {
      const primary2Expr = buildPrimaryExpression(
        factor.primary2,
        basePath,
        baseType,
      );
      return {
        operator: factor.operator, // "^" or ".^"
        operands: [primary1Expr, primary2Expr],
      };
    }

    return primary1Expr;
  }

  // Fallback
  return buildSimpleExpression(factor, basePath, baseType);
}

function buildSimpleExpression(
  expression: any,
  basePath: string,
  baseType: string,
): Expression {
  let operand = expression;

  // Handle object-type simple_expression with terms and addOps
  if (typeof expression === "object" && expression !== null) {
    if (expression.terms) {
      // simple_expression: { addOps: ["+", "-"], terms: [...] }
      const terms = expression.terms.map((term: any) =>
        buildTermExpression(term, basePath, baseType),
      );

      if (terms.length === 1 && !expression.addOps) {
        return terms[0];
      }

      const addOps: string[] = expression.addOps || [];
      // Determine if there's a leading unary operator
      // If addOps.length === terms.length, the first addOp is a leading unary operator
      const hasLeadingOp = addOps.length === terms.length;

      if (terms.length === 1 && hasLeadingOp) {
        // Single term with unary operator (e.g., "-x")
        return {
          operator: addOps[0] === "-" ? "unary_minus" : "unary_plus",
          operands: [terms[0]],
        };
      }

      // Build left-associative expression for addition/subtraction
      let result: Expression;
      let opIndex = 0;

      if (hasLeadingOp) {
        // First operator is unary
        if (addOps[0] === "-") {
          result = {
            operator: "unary_minus",
            operands: [terms[0]],
          };
        } else {
          result = terms[0];
        }
        opIndex = 1;
      } else {
        result = terms[0];
      }

      for (let i = 1; i < terms.length; i++) {
        result = {
          operator: addOps[opIndex],
          operands: [result, terms[i]],
        };
        opIndex++;
      }

      return result;
    }

    // Unknown object structure - log for debugging
    console.log("Unknown Expression: ", JSON.stringify(expression, null, 2));
  }

  if (typeof expression === "string") {
    operand = expandStringOperand(expression, basePath, baseType);
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
