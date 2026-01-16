import { ModifiersN, getTemplates } from "../../../src/parser/template";
import { loadPackage, Template } from "../../../src/parser/";
import { getExpression } from "../../../src/parser/expression";
import { initializeTestModelicaJson } from "./utils";
import * as parser from "../../../src/parser/parser";
const testModelicaFile = "TestPackage.Template.TestTemplate";

const templatePath = "TestPackage.Template.TestTemplate";
let template: Template | undefined;

describe("Expression", () => {
  beforeAll(() => {
    initializeTestModelicaJson();
    loadPackage("TestPackage");
    const templates = getTemplates();
    template = templates.find(
      (t) => t.modelicaPath === templatePath,
    ) as Template;
  });

  it("Parses Simple Value Expression", () => {
    const paramPath = "TestPackage.Template.TestTemplate.expression_bool";
    const { options } = (template as Template).getOptions();
    const option = options[paramPath];
    expect(option.value).toBeTruthy();
    //
  });
});

let inputs: { [key: string]: parser.TemplateInput } = {};

function getInputs() {
  const file = parser.getFile(testModelicaFile) as parser.File;
  const template = file.elementList[0] as parser.LongClass;
  return template.getInputs();
}

describe("Template Input visible/enable expressions", () => {
  beforeAll(() => {
    initializeTestModelicaJson();
    inputs = getInputs();
  });

  it("no enable sets true", () => {
    const truthyPath = "TestPackage.Template.TestTemplate.test_real";
    const truthyInput = inputs[truthyPath];

    // implicit 'true' if no 'enable' is specified
    expect(truthyInput.visible).toBeTruthy();
  });

  it("'final' param sets false", () => {
    const falsyPath = "TestPackage.Template.TestTemplate.should_ignore";
    const falsyInput = inputs[falsyPath];
    expect(falsyInput.visible).toBeFalsy();
  });

  it("'outer' prefix sets false", () => {
    const falsyPath = "TestPackage.Component.SecondComponent.inner_outer_param";
    const falsyInput = inputs[falsyPath];
    expect(falsyInput.visible).toBeFalsy();
  });

  it("'connectorSizing' handled correctly", () => {
    const falsyPath = "TestPackage.Template.TestTemplate.connector_param";
    const falsyInput = inputs[falsyPath];
    expect(falsyInput.visible).toBeFalsy();

    const truthyPath =
      "TestPackage.Template.TestTemplate.connector_param_false";
    const truthyInput = inputs[truthyPath];
    expect(truthyInput.visible).toBeTruthy();
  });
});

describe("Parses expressions according to modelica-json schema", () => {
  it("Parses simple expression with primary1", () => {
    const simpleExpression = {
      simple_expression: {
        terms: [
          {
            factors: [
              {
                primary1: [
                  {
                    simple_expression: {
                      logical_expression: {
                        logical_or: [
                          {
                            logical_and: [
                              {
                                arithmetic_expressions: ["Test.param", "0"],
                                relation_operator: ">",
                              },
                            ],
                          },
                        ],
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    };
    const parsedExpression = { operator: ">", operands: ["Test.param", 0] };
    expect(getExpression(simpleExpression)).toEqual(parsedExpression);
  });
  it("Parses factors with primary1 and primary2", () => {
    const simpleExpression = {
      simple_expression: {
        terms: [
          {
            factors: [
              {
                operator: "^",
                primary1: [
                  {
                    simple_expression: "Te -Ta1",
                  },
                ],
                primary2: "2",
              },
            ],
          },
        ],
      },
    };
    const parsedExpression = {
      operator: "^",
      operands: [
        "Te -Ta1",
        2,
      ],
    };
    expect(getExpression(simpleExpression)).toEqual(parsedExpression);
  });
  it("Parses addOps with leading -", () => {
    const simpleExpression = {
      simple_expression: {
        addOps: ["-", "-", "+"],
        terms: [
          "Modelica.Math.atan(TDryBul_degC +rh_per)",
          "Modelica.Math.atan(rh_per -1.676331)",
          {
            operators: ["*"],
            factors: [
              "0.00391838",
              "Modelica.Math.atan(0.023101*rh_per)",
            ],
          },
        ],
      },
    };
    const parsedExpression = {
      operator: "+",
      operands: [
        {
          operator: "-",
          operands: [
            {
              operator: "-",
              operands: [
                "Modelica.Math.atan(TDryBul_degC +rh_per)"
              ]
            },
            "Modelica.Math.atan(rh_per -1.676331)"
          ]
        },
        {
          operator: "*",
          operands: [
            0.00391838,
            "Modelica.Math.atan(0.023101*rh_per)"
          ]
        }
      ]
    };
    expect(getExpression(simpleExpression)).toEqual(parsedExpression);
  });
});
