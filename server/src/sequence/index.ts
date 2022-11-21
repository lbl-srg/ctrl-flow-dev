import fs from "fs/promises";
import path from "path";
import util from "util";
import process from "process";
import { exec } from "child_process";
import _ from "underscore";
// Enables the use of async/await keywords when executing external processes.
const execPromise = util.promisify(exec);

const SEQUENCE_PATH = path.resolve(__dirname).replace(process.cwd(), ".");
const SEQUENCE_OUTPUT_PATH = `${SEQUENCE_PATH}/output-documents`;
const STYLE_REFERENCE_DOCUMENT = `${SEQUENCE_PATH}/source-styles.docx`;

export enum EnergyCode {
  Ashrae = "ashrae",
  California = "california",
}

export type ControlSequenceInput = {
  energyCode: EnergyCode;
  choices: {
    BuildingsTemplatesAirHandlersFansInterfacesPartialAirHandlertypFanRet: string;
  };
};

export async function writeLatexFile(
  controlSequenceInput: ControlSequenceInput,
  latexFilePath: string,
) {
  const { energyCode, choices } = controlSequenceInput;
  const {
    BuildingsTemplatesAirHandlersFansInterfacesPartialAirHandlertypFanRet,
  } = choices;

  const latexFileContent = String.raw`
    % Below are commands that define the input for the Control Sequence Document.
    % These commands are named after the modelica path of the option they represent without dot characters (e.g., \BuildingsTemplatesAirHandlersFansInterfacesPartialAirHandlertypFanRet).
    % These commands return the modelica path of the selected value with dot characters (e.g., Buildings.Templates.Components.Types.Fan.SingleConstant).
    % These commands are used to decide which parts of the Control Sequence Document are displayed.
    
    % Type of return fan
    
    ${
      BuildingsTemplatesAirHandlersFansInterfacesPartialAirHandlertypFanRet &&
      String.raw`\newcommand\BuildingsTemplatesAirHandlersFansInterfacesPartialAirHandlertypFanRet{${BuildingsTemplatesAirHandlersFansInterfacesPartialAirHandlertypFanRet}}`
    }

    % Configure Energy Code Standard
    \newcommand${
      energyCode === EnergyCode.Ashrae
        ? "\\ASHRAEStandard{}"
        : "\\CaliforniaTitle{}"
    }

    % Sets absolute path to help Pandoc access external assets.

    \newcommand\basepath{${path.resolve(__dirname)}}
    
    % Injects LaTeX template for the Control Sequence Document.
    
    \input{\basepath/template.tex}
  `;

  return fs.writeFile(latexFilePath, latexFileContent);
}

// Note that pandoc does not return anything when done with processing the file,
// which makes debugging possible errors difficult.
export async function convertToDOCX(
  latexFilePath: string,
  docxFilePath: string,
) {
  const pandocBinary = `pandoc`;
  const pandocArguments = `--reference-doc=${STYLE_REFERENCE_DOCUMENT} --table-of-contents ${latexFilePath} -o ${docxFilePath}`;
  const pandocCommand = `${pandocBinary} ${pandocArguments}`;
  console.log("Running containerized Pandoc:", pandocCommand);

  return execPromise(pandocCommand);
}

export async function getConvertedDocument(convertedDocumentPath: string) {
  const file = await fs.readFile(convertedDocumentPath);
  return file;
}

export async function writeControlSequenceDocument(
  controlSequenceInput: ControlSequenceInput,
) {
  const timeMarker = new Date().toISOString();
  const fileName = `sequence-${timeMarker}`;
  const latexFilePath = `${SEQUENCE_OUTPUT_PATH}/${fileName}.tex`;
  const docxFilePath = `${SEQUENCE_OUTPUT_PATH}/${fileName}.docx`;

  // await writeLatexFile(controlSequenceInput, latexFilePath);
  // const { stdout, stderr } = await convertToDOCX(latexFilePath, docxFilePath);
  // console.log(stdout);
  // console.log(stderr);
  // return getConvertedDocument(docxFilePath);
  return "";
}
