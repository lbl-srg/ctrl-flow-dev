# LBL Linkage Widget Backend

## Quickstart

### With a container
1. make sure docker is installed on your computer
1. Run `npm install` to install npm dependencies
1. Run `npm run docker:start` to start the container. Modelica dependencies will installed in the container automatically.

#### note:
When running the docker container, you can use `npm run docker:shell` to get a command prompt for the docker container.

### Without a container
1. Run `npm install` to install npm dependencies
1. Run `npm run install-modelica-deps` to install the modelica-json library, and modelica templates
1. Ensure the `MODELICAPATH` environmental variable points to the correct location.

   e.g.

   ```
   export MODELICAPATH=/path/to/lbl-linkage-widget-v2/server/dependencies/ModelicaStandardLibrary
   export MODELICAPATH=$MODELICAPATH:/path/to/lbl-linkage-widget-v2/server/dependencies/modelica-buildings
   ```

1. Run `npm run start` to start the development server