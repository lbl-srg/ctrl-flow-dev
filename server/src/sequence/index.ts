import fs from "fs/promises";
import path from "path";
import _ from "underscore";
import marked from "marked";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import HTMLtoDOCX from "html-to-docx";

// TODO: Replace this mock type definition with the actual parameters necessary to generate the document
export type TemplateOptions = {
  optional: boolean;
  dual_inlet_airflow_sensors: string;
};

const MARKDOWN_TEMPLATE_FILE_PATH = `${path.resolve(__dirname)}/template.md`;

// TODO: Check that the copy below fits the client's needs
const HTML_HEADER = `<p>&copy; ASHRAE (www.ashrae.org). For personal use only. Additional reproduction, distribution, or transmission in either print or digital form is not permitted without ASHRAE's prior written permission.</p>`;

// TODO: Check that the copy below fits the client's needs
const HTML_FOOTER = `<p>ASHRAE Guideline 36-2018</p>`;

const DOCUMENT_OPTIONS = {};

async function getTemplate() {
  try {
    return fs.readFile(MARKDOWN_TEMPLATE_FILE_PATH, {
      encoding: "utf8",
    });
  } catch (err) {
    console.log(err);
    return;
  }
}

// TODO: As we figure out parameters to create the document, add business logic here
function configureTemplateOptions(parameters: TemplateOptions) {
  return parameters;
}

async function fillInTemplate(
  template: string,
  templateOptions: TemplateOptions,
) {
  return _.template(template)(templateOptions);
}

async function generateDocument(filledInTemplate: string) {
  const htmlBody = marked(filledInTemplate);
  return HTMLtoDOCX(htmlBody, HTML_HEADER, DOCUMENT_OPTIONS, HTML_FOOTER);
}

export default async function (parameters: TemplateOptions) {
  const template = await getTemplate();
  if (!template) {
    // TODO: Return an error so that the frontend can communicate to the user that something went wrong
    return;
  }

  const templateOptions = configureTemplateOptions(parameters);
  const filledInTemplate = await fillInTemplate(template, templateOptions);
  return generateDocument(filledInTemplate);
}
