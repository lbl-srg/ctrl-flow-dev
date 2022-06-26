// /* global PDFTeX */
import _ from "underscore";
import HTMLtoDOCX from "html-to-docx";
// Update marked with the latest major version of the package
import marked from "marked";
import PDFTeX from "texlive";
import { useState } from "react";

import templateString from "../../../templates/template.md.txt";
import latexString from "../../../templates/template.tex.txt";

const template = _.template(templateString);
window.pdf_dataurl = null;

function Sequence() {
  const [params, setParams] = useState({
    optional: true,
    dual_inlet_airflow_sensors: "yes",
  });
  const [rendering, setRendering] = useState(false);
  const onChange = (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    console.log(event.target.name, value);
    setParams({
      ...params,
      [event.target.name]: value,
    });
  };

  const downloadDocx = async () => {
    setRendering(true);
    const markdownString = template(params);
    console.log(markdownString);
    const htmlString = marked(markdownString);
    console.log(htmlString);
    const headerHTMLString = `<p>&copy; ASHRAE (www.ashrae.org). For personal use only. Additional reproduction, distribution, or transmission in either print or digital form is not permitted without ASHRAE's prior written permission.</p>`;
    const documentOptions = {};
    const footerHTMLString = `<p>ASHRAE Guideline 36-2018</p>`;

    const docx = await HTMLtoDOCX(
      htmlString,
      headerHTMLString,
      documentOptions,
      footerHTMLString,
    );

    saveFile(docx);
    setRendering(false);
  };

  const downloadPdf = async () => {
    setRendering(true);

    let header = "";
    Object.entries(params).forEach(([key, value]) => {
      const camelKey = ("_" + key).replace(/_([a-z])/g, (g) =>
        g[1].toUpperCase(),
      );
      header += `\\newcommand{\\Params${camelKey}}{${value}}\n`;
    });
    console.log(header);

    // We'll need to compile twice to build a references index
    const pdftex_toc = new PDFTeX(
      process.env.PUBLIC_URL + "/texlive/pdftex-worker.js",
    );
    const pdftex_final = new PDFTeX(
      process.env.PUBLIC_URL + "/texlive/pdftex-worker.js",
    );

    await pdftex_toc.compile(header + latexString);

    const aux = await pdftex_toc.FS_readFile("/input.aux");
    pdftex_final.FS_createDataFile("/", "input.aux", aux, true, true, true);

    const pdf = await pdftex_final.compile(header + latexString);

    saveURL(pdf);
    setRendering(false);
  };

  const saveFile = (blob) => {
    const a = document.createElement("a");
    const url = window.URL.createObjectURL(blob);

    a.href = url;
    a.download = "2021-06-01 Guideline 36-2021.docx";
    a.click();

    window.URL.revokeObjectURL(url);
  };

  const saveURL = (url) => {
    const a = document.createElement("a");

    a.href = url;
    a.download = "2021-06-01 Guideline 36-2021.pdf";
    a.click();

    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="App">
      <header className="App-header">
        <p>
          <label>
            <input
              value="yes"
              onChange={onChange}
              name="optional"
              type="checkbox"
              checked={params.optional}
            />
            Include optional comments.
          </label>
        </p>
        <p>
          <label>
            <input
              onChange={onChange}
              name="dual_inlet_airflow_sensors"
              type="radio"
              value="yes"
              checked={params.dual_inlet_airflow_sensors === "yes"}
            />
            There are airflow sensors at both inlets to the box.
          </label>
          <br />
          <label>
            <input
              onChange={onChange}
              name="dual_inlet_airflow_sensors"
              type="radio"
              value="no"
              checked={params.dual_inlet_airflow_sensors === "no"}
            />
            There is a single airflow sensor at the box discharge.
          </label>
        </p>
        <button type="button" onClick={downloadPdf} disabled={rendering}>
          Download PDF
        </button>
        &nbsp;
        <button type="button" onClick={downloadDocx} disabled={rendering}>
          Download .doc
        </button>
      </header>
    </div>
  );
}

export default Sequence;
