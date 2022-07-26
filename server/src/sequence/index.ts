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
  const { choices } = controlSequenceInput;
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
    
    % Inject LaTeX template for the Control Sequence Document.
    
    \input{${path.resolve(__dirname)}/template.tex}
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
  const pandocArguments = `--reference-doc=${STYLE_REFERENCE_DOCUMENT} ${latexFilePath} -o ${docxFilePath}`;
  const pandocCommand = `${pandocBinary} ${pandocArguments}`;
  console.log("Running containerized Pandoc:", pandocCommand);

  // DEBUG: ALSO GENERATE PDF
  const PDFpandocBinary = `pandoc`;
  const PDFpandocArguments = `${latexFilePath} -o ${latexFilePath.replace(
    ".tex",
    ".pdf",
  )}`;
  const PDFpandocCommand = `${PDFpandocBinary} ${PDFpandocArguments}`;
  await execPromise(PDFpandocCommand);
  // END OF DEBUG

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

  await writeLatexFile(controlSequenceInput, latexFilePath);
  await convertToDOCX(latexFilePath, docxFilePath);
  return getConvertedDocument(docxFilePath);
}
