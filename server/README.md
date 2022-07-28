# LBNL Linkage Widget Backend

## Starting the development server

1. Install Docker on your machine.
1. Copy the `.env.example` file and name it `.env`. In the newly created file, change the value of `NODE_ENV` to be `development`.
1. Run `npm install` to install NPM dependencies.
1. Run `npm run docker:start` to start the Node application in Docker. If you haven't built the Docker image before, this might take several minutes. Once the image is ready, the container outputs logs from the development server in the terminal. The container is set up to add a couple of crucial dependencies to the environment for the service to work properly:

   - Modelica dependencies.
   - Pandoc CLI.
   - LaTeX.

1. Run `npm run docker:stop` to stop the server when you are done or if you want to switch to debug mode.

> **Note** You may use `npm start` to start the Node application outside of Docker but you will need to install expected dependencies on your machine for the service to work properly.

## Debugging the development server

### Debugging the container

Run `npm run docker:shell` to access the filesystem of the running Docker image with a terminal prompt.

### Debugging code with Chrome

1. Run `npm run docker:debug` to start the development server in debug mode.
1. Go to `chrome://inspect` in the Chrome browser.
1. Open the dedicated tools for Node. These tools provide a console, the ability to inspect source code, etc.

### Debugging code with Visual Studio Code

1. Run `npm run docker:debug` to start the development server in debug mode.
1. In VSCode, select the `Run and Debug` tab in the left hand column. Click the cog icon at the top of the opened column and add the following `launch.json` file:
   ```
   {
      "version": "0.2.0",
      "configurations": [
         {
            "type": "node",
            "request": "attach",
            "name": "Docker: Attach",
            "port": 9229,
            "address": "localhost",
            "localRoot": "${workspaceFolder}/server",
            "remoteRoot": "/app",
            "outFiles": [
               "${workspaceFolder}/build/app/**/*.js"
            ],
         }
      ]
   }
   ```
1. With the `Run and Debug` column open, click the play icon at the top to run `Docker: Attach`. At this point, you should be able to set and hit breakpoints in the source code of the server.

### Debugging tests with Visual Studio Code

1. Install the 'Remote Containers' extension.
1. Click on the new icon that will show in the left hand column with a hover tip of 'Remote Explorer.'
1. Existing containers on your machine should be shown. If it isn't already started, run `npm run docker:start` to make sure that Docker containers are running.
1. Hover over the `linkage-api` container and click the `Attach to Container` button (a folder with a `+`).
1. A new VSCode window will open that is attached and reading from the `linkage-api` container. It'll be blank, though, as you'll need to specify which directory you'd like to open in the container. Open the `/app` directory (where the `server` folder is mounted).
1. The VSCode instance running in the container will have its own unique set of extensions. To run tests, install the `Jest` extension. This should create a new entry in the left hand column of VSCode that looks like an Erlenmeyer flask (aka a beaker). If the entry doesn't show, you may need to close and re-open VSCode.
1. The extension will take a moment to discover tests, but after that process is done, you should be up and running to set breakpoints and debug tests.

## Testing

This project uses Jest to tests functionalities.

- Run `npm run test` to execute all tests.
- Run `npm run test:ci` to execute all tests intended for the continuous integration workflow.
- Run `npm run unit-test` to execute unit tests.
- Run `npm run integration-test` to execute integration tests.

## GitHub Actions

This repository leverages GitHub Actions to run continuous integration scripts. You can debug these scripts locally thanks to a tool called [act](https://github.com/nektos/act).

For instance, the command below locally executes a dry run of the `server-tests` GitHub Action as if it received a `pull_request` event:

```
sudo act pull_request -W .github/workflows/server-tests.yml -n
```

> **Note** `act` must be executed at the root level of the repository to avoid errors that are essentially false negative.

## Control Sequence Document generation

The backend features an endpoint at `POST /api/sequence` that generates and serves a Control Sequence Document in the `.docx` file format. This document is formed thanks to, among other things, a `.tex` LaTeX template and the input from the request. The content of the LaTeX template derives from the [ASHRAE Guideline 36-2021 document](https://docs.google.com/document/d/15H8KTy0EeMlk2jMKgiyZ5Y_SO3Q0dU3y/edit).

> **Note** If an error occurred during the creation of the Control Sequence Document, the endpoint will most likely respond with an empty object or, if the error is catchable, a message providing some information about the issue that occurred. Unfortunately, it seems that the external tool used to create the document, Pandoc, does a poor job returning the errors it encounters.

### Key files and folders

Beyond the entrypoint for the endpoint at `/src/index.ts`, all the code and files needed to generate the Control Sequence Document can be found in the `/src/sequence` folder.

This folder contains the following elements:

- `index.ts`: The code for the backend to process the request input and respond with the Control Sequence Document as a binary file.
- `template.tex`: The LaTeX template used by Pandoc to produce a `.docx` file.
- `source-styles.docx`: The Microsoft Word document used by Pandoc to define the styles found in the resulting Control Sequence Document.
- `/latex-assets`: The subfolder containing raw external assets used by the LaTeX template. Typically, this subfolder contains images in the PNG, JPEG, and SVG formats that were exported manually from the ASHRAE Guideline 36-2021 document.
- `/converted-latex-assets`: The subfolder containing converted external assets used by the LaTeX template. Typically, this subfolder contains images that are also stored as SVGs in the `/latex-assets` subfolder and were manually converted to the PDF format. This folder is necessary to help LaTeX and Pandoc with certain file formats that they do not support very well.
- `/output-documents`: The subfolder containing files created by the endpoint as a result of the generation of the Control Sequence Document. Typically, this subfolder contains `.docx` and `.tex` files where the name follows this pattern: `sequence-DATE_TIME_UTC.FILE_EXTENSION` (e.g., `sequence-2022-07-28T20:07:15.746Z.docx`).

> **Note** None of the files created in this process are exposed by the backend. The endpoint directly serves the `.docx` Control Sequence Document once after generating it. The file is stored in the filesystem but kept private. If access to Control Sequence Documents is needed after they are generated, some additional code will need to be written in order to handle that (most likely using the `express.static` middleware pointing at the `/sequence/output-documents` subfolder or [another solution described in this blog post](https://thewebdev.info/2021/03/12/how-to-let-users-download-a-file-from-node-js-server-with-express/), for example).

### Control Sequence Document generation flow

The `.docx` document returned by the endpoint is created in the following manner:

- The start point is the request input, which should be used to dictate which parts of the LaTeX template are shown/hidden as well as whatever aspects of the Control Sequence Document are meant to be dynamic.
- This input is processed in the `writeLatexFile` function. The function generates a dated `.tex` file (e.g., `sequence-2022-07-28T20:07:15.746Z.tex`) in `/output-documents`. This file contains LaTeX commands that can then be used in the `template.tex` file to work as expected. These commands are essentially variables that return a string but the logic or the nature of these commands can be customized by developers as needed. If the shape or the properties of the request input object changes, developers should most likely edit the commands defined in the [raw template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/raw) to reflect the change. The created `.tex` file includes a `\input` command at the end that injects the `template.tex` file to this `.tex` file. Since LaTeX files are not dynamic by nature, creating an additional `.tex` file on the fly is necessary to accomodate for input.
- Once the `.tex` file is written, the `convertToDOCX` function summons [Pandoc](https://pandoc.org/MANUAL.html) as an external process to convert the LaTeX file to a Microsoft Word Document. Pandoc uses the `source-styles.docx` reference document to customize the styles available in the Control Sequence Document. Pandoc also auto-magically generates a table of contents dynamically based on the [various sections found in the LaTeX template](https://www.overleaf.com/learn/latex/Sections_and_chapters#Document_sectioning).
- Finally, `getConvertedDocument` serves the Control Sequence Document that was generated (if any).

### Editing the LaTeX template

You may edit and compile the `template.tex` files using a graphic user interface (GUI) like [Texmaker LaTeX editor](https://www.xm1math.net/texmaker/download.html). Texmaker requires to install a [Tex distribution](https://www.latex-project.org/get/) on your machine in order to compile your `.tex` documents.

A GUI made for the purpose of editing LaTeX files can provide valuable niceties. However, you will need to re-create the environment that the backend is using in order to make sure that the results you see are consistent with the results from the backend, so be wary.

Furthermore, the backend takes into account request input by creating a `.tex` file dynamically that `/input`s the `template.tex` file. If you're working with `template.tex` directly, you might need to add these commands by hand in the template to try out their behavior when they return a particular value.

Similarly, LaTeX editors with a GUI typically output PDF files. You might need to configure your editor to use Pandoc as summoned by the backend to ensure that the compiled Microsoft Word document looks like what the backend produces.

Online tools like [Papeeria](www.papeeria.com) also exist to edit and compile `.tex` files in your browser.

> **Note** The recommended native Tex distribution for Mac ([MacTex](https://www.tug.org/mactex/mactex-download.html)) seems to be particularly sizeable as a 4.6G download as of July 6, 2022. Similarly, compiling files can be a lengthy process.

### Converting SVG assets

LaTeX does not support rendering SVG assets natively but packages can be used to alleviate this issue. Unfortunately, it seems like using Pandoc adds complexity to this issue since [Pandoc does not appear to support SVGs in LaTeX](https://github.com/jgm/pandoc/issues/265). Further research on this topic could prove to be successful in finding a method to use SVGs directly in the LaTeX template with Pandoc. In the meantime, it seems that converting SVGs to PDFs ahead of time as part of the process of processing the ASHRAE Guideline 36-2021 document as a basis for the Control Sequence Docuemnt template is satisfactory and also avoids the time-consuming task of converting SVGs every time a request is sent to the endpoint.

Inkscape can be used to convert SVGs to PDFs with the following command where `SOURCE_SVG_FILE` is the path to the SVG file to be converted and `DESTINATION_PDF_FILE` is the path of the resulting PDF file:

inkscape -D -z --file=SOURCE_SVG_FILE.svg --export-pdf=DESTINATION_PDF_FILE.pdf --export-latex

It is recommended to store the PDF files into the `/converted-latex-assets` subfolder but this is not required.

### Editing the styles of the Control Sequence Document

The actual content of the `source-styles.docx` document is ignored but its styles are saved in the Control Sequence Document.

As a consequence, you can use Microsoft Word to edit styles in this document manually. You can, for example, add numbering or italics to one of the pre-existing styles. When you save the style document and generate a new Control Sequence Document with `source-styles.docx` as a reference, you should see the updated style(s) right away in the Control Sequence Document.
