import {
  ControlSequenceInput,
  EnergyCode,
  writeLatexFile,
  convertToODT,
  convertToDOCX,
} from "../../../src/sequence";

describe("Control Sequence Document", () => {
  it("writeLatexFile executes without error", async () => {
    const input: ControlSequenceInput = {
      energyCode: EnergyCode.Ashrae,
      choices: {
        BuildingsTemplatesAirHandlersFansInterfacesPartialAirHandlertypFanRet:
          "Buildings.Templates.Components.Types.Fan.SingleConstant",
      },
    };
    const sequencePath = `${process.cwd()}/src/sequence`;
    const outputPath = `${sequencePath}/output-documents`;
    const latexFilePath = `${outputPath}/unit-test.tex`;
    await writeLatexFile(input, latexFilePath);
  });

  it("convertToODT executes without error", async () => {
    const rootPath = process.cwd();
    const sequencePath = `${process.cwd()}/src/sequence`;
    const outputPath = `${sequencePath}/output-documents`;
    const latexFilePath = `${outputPath}/unit-test.tex`;
    const odtFilePath = `${outputPath}/unit-test.odt`;
    const odtRootFilePath = `${rootPath}/unit-test.odt`;
    const tempOdtRootFilePath = `${rootPath}/unit-test`;
    await convertToODT(
      latexFilePath,
      odtFilePath,
      odtRootFilePath,
      tempOdtRootFilePath,
    );
  });

  it("convertToDOCX executes without error", async () => {
    const sequencePath = `${process.cwd()}/src/sequence`;
    const outputPath = `${sequencePath}/output-documents`;
    const odtFilePath = `${outputPath}/unit-tests.odt`;
    const docxFilePath = `${outputPath}/unit-test.docx`;
    await convertToDOCX(odtFilePath, docxFilePath);
  });
});
