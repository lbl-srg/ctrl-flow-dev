# Installs Pandoc, TexLive, and make4ht on a Ubuntu Linux distribution
FROM ubuntu as ubuntu-pandoc
RUN apt-get --assume-yes update && apt-get --assume-yes install wget pandoc=2.9.2.1-3ubuntu2 texlive=2021.20220204-1 texlive-extra-utils=2021.20220204-1
RUN pandoc --version
RUN tex --version
RUN make4ht --version

# Installs Node 16.16.0 LTS with NVM for a x86-64 architecture
FROM ubuntu-pandoc as ubuntu-pandoc-node
ENV NVM_DIR=/root/.nvm
ENV NODE_VERSION=16.16.0
RUN apt-get --assume-yes update && apt-get --assume-yes install curl bash
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="/root/.nvm/versions/node/v${NODE_VERSION}/bin/:${PATH}"
RUN node --version
RUN npm --version
WORKDIR /app

# Prepares Modelica dependency scripts
FROM node:16-alpine as alpine-node-prep-modelica
RUN apk update && apk --no-cache add openjdk13
RUN mkdir dependencies
WORKDIR /app
COPY bin/ bin/
COPY package*.json .

# Installs Modelica dependencies
FROM alpine-node-prep-modelica as alpine-node-modelica
RUN apk update && apk --no-cache add make curl git
RUN npm run install-modelica-deps
WORKDIR /dependencies
ENV MODELICAPATH=/dependencies/ModelicaStandardLibrary:/dependencies/modelica-buildings
RUN mkdir template-json
RUN node modelica-json/app.js -f modelica-buildings/Buildings/Templates -o json -d template-json

FROM ubuntu-pandoc-node as ubuntu-pandoc-node-modelica
COPY --from=alpine-node-modelica /dependencies /dependencies
