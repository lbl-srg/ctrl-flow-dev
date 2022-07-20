import fs from "fs";
import tmp from "tmp";
import path from "path";
import _ from "underscore";
import marked from "marked";

// TODO: Replace this mock type definition with the actual parameters necessary to generate the document
export type ModelicaOptions = {
  optional: boolean;
  data: string;
};

// const MARKDOWN_TEMPLATE_FILE_PATH = `${path.resolve(__dirname)}/template.md`;

// TODO: Check that the copy below fits the client's needs
// const HTML_HEADER = `<p>&copy; ASHRAE (www.ashrae.org). For personal use only. Additional reproduction, distribution, or transmission in either print or digital form is not permitted without ASHRAE's prior written permission.</p>`;

// TODO: Check that the copy below fits the client's needs
// const HTML_FOOTER = `<p>ASHRAE Guideline 36-2018</p>`;

const DOCUMENT_OPTIONS = {};

// async function getTemplate() {
//   try {
//     return fs.readFile(MARKDOWN_TEMPLATE_FILE_PATH, {
//       encoding: "utf8",
//     });
//   } catch (err) {
//     console.log(err);
//     return;
//   }
// }

// TODO: As we figure out parameters to create the document, add business logic here
function configureModelicaOptions(parameters: ModelicaOptions) {
  return parameters;
}

async function buildModelicaContent(
  ModelicaOptions: ModelicaOptions,
) {
  return JSON.stringify(ModelicaOptions.data);
}

async function generateDocument(content: string) {
  const modelicaFile = tmp.fileSync();
  let response: any;

  fs.writeSync(modelicaFile.fd, content, 0, 'utf8');

  response = fs.readFileSync(modelicaFile.fd);

  modelicaFile.removeCallback();

  return response;
}

export default async function (parameters: ModelicaOptions) {
  // const template = await getTemplate();
  // if (!template) {
  //   // TODO: Return an error so that the frontend can communicate to the user that something went wrong
  //   return;
  // }

  const modelicaOptions = configureModelicaOptions(parameters);
  const modelicaContent = await buildModelicaContent(modelicaOptions);
  return generateDocument(modelicaContent);
}
