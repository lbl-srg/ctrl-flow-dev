# Installs Pandoc, TexLive, and make4ht on a Ubuntu Linux distribution
FROM ubuntu:22.04 AS ubuntu-pandoc

# Installs Node 16.16.0 LTS with NVM
# FROM ubuntu-pandoc as ubuntu-pandoc-node
RUN apt-get --assume-yes update && apt-get --assume-yes install curl bash
ENV NVM_DIR=/usr/local/nvm
ENV NODE_VERSION=20.18.1
RUN mkdir $NVM_DIR
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="${NVM_DIR}/versions/node/v${NODE_VERSION}/bin/:${PATH}"
RUN node --version
RUN npm --version

# Prepares Modelica dependency scripts
RUN apt-get update && apt-get -y install default-jdk
RUN mkdir dependencies
WORKDIR /server
COPY bin/ bin/
COPY package*.json ./

# Install python dependencies
RUN apt-get update --assume-yes && apt-get upgrade --assume-yes
RUN apt-get --assume-yes install pip
COPY scripts/sequence-doc scripts/sequence-doc
RUN npm run install-python-deps

# Installs Modelica dependencies
RUN apt-get -y install make curl git
RUN npm run install-modelica-deps
WORKDIR /dependencies
# These files have typos that need to be fixed before we can bundle with webpack
RUN sed -i 's/condition_attribute/conditionAttribute/g' ./modelica-json/json2mo/componentDeclaration.js
RUN sed -i 's/for_indices/forIndices/g' ./modelica-json/json2mo/forStatement.js
RUN sed -i 's/named_arguments/namedArguments/g' ./modelica-json/json2mo/functionArgument.js
ENV MODELICAPATH=/dependencies/ModelicaStandardLibrary:/dependencies/modelica-buildings
RUN mkdir template-json
# This fails to run on amd64, must be arm64 platform
RUN node modelica-json/app.js -f modelica-buildings/Buildings/Templates -o json -d template-json

# Adds Modelica dependencies to the resulting image
# FROM alpine-node-modelica as ubuntu-pandoc-node-modelica
# COPY --from=alpine-node-modelica /dependencies /dependencies
WORKDIR /server

# Copy the rest of the server app
RUN npm i
COPY . .

RUN npm run parseTemplateJSON

RUN npm run build
RUN npx webpack

ARG PORT

# For when image is run
CMD ["node", "dist/index.js"]
EXPOSE ${PORT}
