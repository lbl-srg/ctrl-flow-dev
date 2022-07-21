# LBNL Linkage Widget Backend

## Starting the development server

1. Install Docker on your machine.
1. Copy the `.env.example` file and name it `.env`. In the newly created file, change the value of `NODE_ENV` to be `development`.
1. Run `npm install` to install NPM dependencies.
1. Run `npm run docker:start` to start the application in Docker. This command runs the following containers in [detached mode](https://docs.docker.com/engine/reference/commandline/compose_up/#options) and outputs logs from the development server:

   - Pandoc CLI.
   - `make4ht` CLI.
   - Modelica dependencies.

1. Run `npm run docker:stop` to stop the application when you are done or if you want to switch to debug mode.

## Debugging the development server

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
- Run `npm run unit-test` to execute unit tests.
- Run `npm run integration-test` to execute integration tests.

## GitHub Actions

This repository leverages GitHub Actions to run continuous integration scripts. You can debug these scripts locally thanks to a tool called [act](https://github.com/nektos/act).

For instance, the command below locally executes a dry run of the `server-tests` GitHub Action as if it received a `pull_request` event:

```
sudo act pull_request -W .github/workflows/server-tests.yml -n
```

> **Note** `act` must be executed at the root level of the repository to avoid errors that are essentially false negative.

## Document generation

### Document preparation with LaTeX

You may edit and compile `.tex` files using a graphic user interface like [Texmaker LaTeX editor](https://www.xm1math.net/texmaker/download.html). Texmaker requires to install a [Tex distribution](https://www.latex-project.org/get/) on your machine in order to compile your `.tex` documents.

> **Note** The recommended native Tex distribution for Mac ([MacTex](https://www.tug.org/mactex/mactex-download.html)) seems to be particularly sizeable as a 4.6G download as of July 6, 2022. Similarly, compiling files can be a lengthy process.

Online tools like [Papeeria](www.papeeria.com) also exist to edit and compile `.tex` files in your browser.
