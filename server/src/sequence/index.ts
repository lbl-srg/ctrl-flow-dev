import path from "path";
import _ from "underscore";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pandoc from "node-pandoc-promise";

// TODO: Replace this mock type definition with the actual parameters necessary to generate the document
export type TemplateOptions = {
  optional: boolean;
  dual_inlet_airflow_sensors: string;
};

const SEQUENCE_DOCUMENTATION_TEMPLATE_PATH = `${path.resolve(
  __dirname,
)}/template.tex`;
const SEQUENCE_DOCUMENTATION_TEMPLATE_FORMAT = "latex";
const SEQUENCE_DOCUMENTATION_OUTPUT_PARTIAL_PATH = `${path.resolve(
  __dirname,
)}/SequenceDocumentation-`;
const SEQUENCE_DOCUMENTATION_OUTPUT_EXTENSION = ".docx";

async function generateDocument() {
  const timeMarker = new Date().toISOString();
  const destinationFile = `${SEQUENCE_DOCUMENTATION_OUTPUT_PARTIAL_PATH}${timeMarker}${SEQUENCE_DOCUMENTATION_OUTPUT_EXTENSION}`;
  const pandocArguments =
    `-f ${SEQUENCE_DOCUMENTATION_TEMPLATE_FORMAT} -o ${destinationFile}`.split(
      " ",
    );
  console.log(
    "Running Pandoc with the following arguments:",
    SEQUENCE_DOCUMENTATION_TEMPLATE_PATH,
    pandocArguments.join(" "),
  );
  await pandoc(SEQUENCE_DOCUMENTATION_TEMPLATE_PATH, pandocArguments);
}

export async function writeSequenceDocumentation(parameters: TemplateOptions) {
  const document = await generateDocument();
  return document;

  /*
  const template = await getTemplate();
  if (!template) {
    // TODO: Return an error so that the frontend can communicate to the user that something went wrong
    return;
  }

  const templateOptions = configureTemplateOptions(parameters);
  const filledInTemplate = await fillInTemplate(template, templateOptions);
  return generateDocument(filledInTemplate);
  */
}
