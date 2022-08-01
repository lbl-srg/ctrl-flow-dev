import {
  ControlSequenceInput,
  EnergyCode,
  writeLatexFile,
  convertToDOCX,
} from "../../../src/sequence";

const TIMEOUT_IN_MILLISECONDS = 30000;

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

  it(
    "convertToDOCX executes without error",
    async () => {
      const sequencePath = `${process.cwd()}/src/sequence`;
      const outputPath = `${sequencePath}/output-documents`;
      const latexFilePath = `${outputPath}/unit-test.tex`;
      const docxFilePath = `${outputPath}/unit-test.docx`;
      await convertToDOCX(latexFilePath, docxFilePath);
    },
    TIMEOUT_IN_MILLISECONDS,
  );
});
