# LBL Linkage Widget Backend

## Quickstart

1. Run `npm install` to install NPM dependencies.
1. Copy the `.env.example` file and name it `.env`. Change `NODE_ENV` in this file to `development`.

### With a container

1. Make sure docker is installed on your computer.
1. Run `npm run docker:start` to start the container.
   - This will also install the modelica dependencies in the container.
   - The container starts in detached mode. Run `npm run docker:logs` to see server logs.
   - You can run `npm run docker:shell` to get a command prompt for the docker container.
   - Run `npm run docker:stop` to stop the container.

### Without a container

1. Run `npm run install-modelica-deps` to install the modelica-json library and modelica templates.
1. Run `npm i` in `/dependencies` to install packages.
1. Ensure the `MODELICAPATH` environmental variable points to the correct location.

   e.g.

   ```
   export MODELICAPATH=/path/to/lbl-linkage-widget-v2/server/dependencies/ModelicaStandardLibrary
   export MODELICAPATH=$MODELICAPATH:/path/to/lbl-linkage-widget-v2/server/dependencies/modelica-buildings
   ```

1. Run `npm run start` to start the development server.

## Debugging with VS Code

### Debugging in the container

1. Stop the current Linkage server container: `npm run docker:stop`.
1. Start a debug container: `npm run docker:debug`.
1. In VS Code, select the `Run and Debug` tab in the left hand column, click the cog icon at the top of the opened column and add the following `launch.json` file:
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
1. With the `Run and Debug` column open, click the play icon at the top to run `Docker: Attach`. At this point you should be able to set and hit breakpoints in the server source code.

### Debugging Jest tests in the container

1. Install the 'Remote Containers' extension.
1. Click on the new icon that will show in the left hand column with a hover tip of 'Remote Explorer'.
1. Existing containers on your machine should be shown. If it isn't already started, make sure the Linkage container is running: `npm run docker:start`. Hover over the `linkage-widget` container and click the `Attach to Container` button (a folder with a `+`).
1. A new VS Code window will open that is attached and reading from the `linkage-widget` container. It'll be blank, though, as you'll need to specify which directory you'd like to open in the container. Open the `/app` directory (where the `server` folder is mounted).
1. The VS Code instance running in the container will have its own unique set of extensions. To run tests, install the `Jest` extension. This should create a new entry in the left hand column of VS Code that looks like an Erlenmeyer flask (aka a beaker). If the entry doesn't show, you may need to close and re-open VS Code.
1. The extension will take a moment to discover tests, but after that process is done, you should be up and running to set breakpoints and debug tests.

## Document preparation with LaTeX

This server leverages [LaTeX](https://www.latex-project.org/) files to generate documents from templates. [Pandoc](https://pandoc.org/) is used to convert `.tex` files into `.docx`.

You may edit and compile `.tex` files using a graphic user interface like [Texmaker LaTeX editor](https://www.xm1math.net/texmaker/download.html). Texmaker requires to install a [Tex distribution](https://www.latex-project.org/get/) on your machine in order to compile your `.tex` documents.

> ** Note** The recommended native Tex distribution for Mac ([MacTex](https://www.tug.org/mactex/mactex-download.html)) seems to be particularly sizeable as a 4.6G download as of July 6, 2022. Similarly, compiling files can be a lengthy process.

Online tools like [Papeeria](www.papeeria.com) also exist to edit and compile `.tex` files in your browser.

## Docker container for Pandoc

TODO
