# LBL Linkage Widget Backend

## Quickstart

1. Run `npm install` to install NPM dependencies
1. Copy the `.env.example` file and name it `.env`. Change `NODE_ENV` in this file to `development`

### With a container

1. make sure docker is installed on your computer
1. Run `npm run docker:start` to start the container.
   - This will also install the modelica dependencies in the container
   - The container starts in detached mode. Run `npm run docker:logs` to see server logs
   - You can run `npm run docker:shell` to get a command prompt for the docker container.
   - Run `npm run docker:stop` to stop the container

### Without a container

1. Run `npm run install-modelica-deps` to install the modelica-json library, and modelica templates
1. Run `npm i` in `/dependencies` to install packages.
1. Ensure the `MODELICAPATH` environmental variable points to the correct location.

   e.g.

   ```
   export MODELICAPATH=/path/to/lbl-linkage-widget-v2/server/dependencies/ModelicaStandardLibrary
   export MODELICAPATH=$MODELICAPATH:/path/to/lbl-linkage-widget-v2/server/dependencies/modelica-buildings
   ```

1. Run `npm run start` to start the development server

## Debugging in the container with VS Code

1. Stop the current linkage-widget container: `npm run docker:stop`
1. Start a debug container: `npm run docker:debug`.
1. In VS Code, select the `Run and Debug` tab in the left hand column, click the gear/cog icon at the top of the opened column and add the following `launch.json`:
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
1. With the `Run and Debug` column open, at the top click play to run `Docker: Attach`. At this point you should be able to set and hit breakpoints in the server source code.

## Debugging Jest Tests in the Container with VS Code

1. Install the 'Remote Containers' extension
1. A new icon will show in the left hand column with a hover tip of 'Remote Explorer'. Select it.
1. Existing containers on your machine should be shown. If it isn't already started, make sure the linkage container is running: `npm run docker:start`. Hover over the 'linkage-widget' container and click the 'Attach to Container' button (a folder with a '+').
1. A new VS code window will open that is attached and reading from the `linkage-widget` container. It'll be blank though as you'll need to specify which directory you'd like to open in the container. Open the `/app` directory (where the `server` folder is mounted).
1. The VS Code instance running in the container will have its own unique set of extensions. To run tests, install the `Jest` extension. This should create a new entry in the left hand column of VS Code that looks like a Erlenmeyer Flask (beaker) (If it doesn't show you may need to close and re-open VS Code).
1. The extension will take a moment to discover tests, but after that is done you should be up and running to set breakpoints and debug tests.
