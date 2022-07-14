import fs from "fs/promises";
import path from "path";
import util from "util";
import process from "process";
import { exec } from "child_process";
import _ from "underscore";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pandoc from "node-pandoc-promise";

// Enables the use of async/await keywords when executing external processes.
const execPromise = util.promisify(exec);

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

async function writeLatexFile(
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

// Pandoc does not support all LaTeX functionalities that other compilers support
// (e.g., https://github.com/jgm/pandoc/issues/8029, https://github.com/jgm/pandoc/issues/7757, https://github.com/jgm/pandoc/issues/8027).
// The result of converting LaTeX files to Microsoft Word Documents with Pandoc are pretty unpredictable as to what will work as expected or not.
// So we use make4ht as an intermediary to create an Open Office Document that we then convert into a Microsoft Word Document with Pandoc.
async function convertToODT(
  latexFilePath: string,
  odtFilePath: string,
  odtRootFilePath: string,
  tempOdtRootFilePath: string,
) {
  const conversionResult = await execPromise(`make4ht -f odt ${latexFilePath}`);
  // Moves the .odt file to the output folder.
  await fs.rename(odtRootFilePath, odtFilePath);
  // Removes temporary file at the root of the server folder.
  await execPromise(`rm ${tempOdtRootFilePath}.*`);
  return conversionResult;
}

// Note that pandoc does not return anything when done with processing the file,
// which makes debugging possible errors difficult.
async function convertToDOCX(odtFilePath: string, docxFilePath: string) {
  const pandocArguments = `-f odt -o ${docxFilePath}`.split(" ");

  console.log(
    "Running Pandoc with the following arguments:",
    odtFilePath,
    pandocArguments.join(" "),
  );

  await pandoc(odtFilePath, pandocArguments);
}

async function getConvertedDocument(convertedDocumentPath: string) {
  const file = await fs.readFile(convertedDocumentPath);
  return file;
}

export async function writeControlSequenceDocument(
  controlSequenceInput: ControlSequenceInput,
) {
  const timeMarker = new Date().toISOString();
  const fileName = `sequence-${timeMarker}`;

  const rootPath = process.cwd();
  const sequencePath = path.resolve(__dirname);
  const outputPath = `${sequencePath}/output-documents`;

  const latexFilePath = `${outputPath}/${fileName}.tex`;
  const odtFilePath = `${outputPath}/${fileName}.odt`;
  const odtRootFilePath = `${rootPath}/${fileName}.odt`;
  const tempOdtRootFilePath = `${rootPath}/${fileName}`;
  const docxFilePath = `${outputPath}/${fileName}.docx`;

  await writeLatexFile(controlSequenceInput, latexFilePath);
  await convertToODT(
    latexFilePath,
    odtFilePath,
    odtRootFilePath,
    tempOdtRootFilePath,
  );
  await convertToDOCX(odtFilePath, docxFilePath);
  return getConvertedDocument(docxFilePath);
}
