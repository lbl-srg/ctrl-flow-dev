# LBL Linkage Widget Backend

## Quickstart

1. Run `npm install` to install npm dependencies
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
