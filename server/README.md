# LBL Linkage Widget Backend

## Quickstart

### With a container
1. make sure docker is installed on your computer
1. Run `npm install` to install npm dependencies
1. Run `npm run docker:start` to start the container. Modelica dependencies will installed in the container automatically.

### Without a container
1. Run `npm install` to install npm dependencies
1. Run `npm run install-modelica-deps` to install the modelica-json library, and modelica templates
1. Run `npm run start` to start the development server
