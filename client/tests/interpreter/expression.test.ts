import { evaluate } from "../../src/interpreter/interpreter";
import { buildExpression } from "../utils";

/**
 * Expression evaluation tests
 */

describe("Test set", () => {
  it("Simple expression evaluation without use of context", () => {
    const expectedValue = 1;
    const simpleExpression = buildExpression("none", [expectedValue]);
    const value = evaluate(simpleExpression);
    expect(value).toEqual(expectedValue);
  });

  it("Handles < and <= and > and >=", () => {
    expect(evaluate(buildExpression("<", [5, 4]))).toBeFalsy();
    expect(evaluate(buildExpression("<", [4, 5]))).toBeTruthy();
    expect(evaluate(buildExpression(">", [1, 2]))).toBeFalsy();
    expect(evaluate(buildExpression(">", [2, 1]))).toBeTruthy();
    expect(evaluate(buildExpression(">=", [2, 2]))).toBeTruthy();
    expect(evaluate(buildExpression(">=", [3, 2]))).toBeTruthy();
    expect(evaluate(buildExpression(">=", [1, 2]))).toBeFalsy();
    expect(evaluate(buildExpression("<=", [2, 2]))).toBeTruthy();
    expect(evaluate(buildExpression("<=", [4, 5]))).toBeTruthy();
    expect(evaluate(buildExpression("<=", [5, 4]))).toBeFalsy();
  });

  it("Handles == and !=", () => {
    expect(evaluate(buildExpression("==", [1, 1, 1, 1]))).toBeTruthy();
    expect(evaluate(buildExpression("==", [3]))).toBeTruthy();
    expect(evaluate(buildExpression("==", ["a", "a", "a"]))).toBeTruthy();
    expect(evaluate(buildExpression("==", ["a", "a", "c"]))).toBeFalsy();
    expect(evaluate(buildExpression("!=", [1, 1, 2]))).toBeTruthy();
    expect(evaluate(buildExpression("!=", [1]))).toBeFalsy();
  });

  it("Handles if expression", () => {
    const expressionTrue = buildExpression("==", [1, 1]);
    const expressionFalse = buildExpression("==", [1, 2]);
    const ifValue = "if value returned";
    const elseIfValue = "elseif value returned";
    const elseValue = "else value returned";

    const AllTrueExpression = {
      operator: "if_elseif",
      operands: [
        {
          operator: "if",
          operands: [expressionTrue, ifValue],
        },
        {
          operator: "else_if",
          operands: [expressionTrue, elseIfValue],
        },
        {
          operator: "else",
          operands: [elseValue],
        },
      ],
    };

    const IfTrueExpression = {
      operator: "if_elseif",
      operands: [
        {
          operator: "if",
          operands: [expressionTrue, ifValue],
        },
        {
          operator: "else_if",
          operands: [expressionFalse, elseIfValue],
        },
        {
          operator: "else",
          operands: [elseValue],
        },
      ],
    };

    const ElseIfTrueExpression = {
      operator: "if_elseif",
      operands: [
        {
          operator: "if",
          operands: [expressionFalse, ifValue],
        },
        {
          operator: "else_if",
          operands: [expressionTrue, elseIfValue],
        },
        {
          operator: "else",
          operands: [elseValue],
        },
      ],
    };

    const ElseTrueExpression = {
      operator: "if_elseif",
      operands: [
        {
          operator: "if",
          operands: [expressionFalse, ifValue],
        },
        {
          operator: "else_if",
          operands: [expressionFalse, elseIfValue],
        },
        {
          operator: "else",
          operands: [elseValue],
        },
      ],
    };

    const evaluatedAllTrueValue = evaluate(AllTrueExpression);
    expect(evaluatedAllTrueValue).toEqual(ifValue);
    const evaluatedIfTrueValue = evaluate(IfTrueExpression);
    expect(evaluatedIfTrueValue).toEqual(ifValue);
    const evaluatedElseIfTrueValue = evaluate(ElseIfTrueExpression);
    expect(evaluatedElseIfTrueValue).toEqual(elseIfValue);
    const evaluatedElseTrueValue = evaluate(ElseTrueExpression);
    expect(evaluatedElseTrueValue).toEqual(elseValue);
  });
});
