# Installs Pandoc, TexLive, and make4ht on a Ubuntu Linux distribution
FROM ubuntu:22.04 as ubuntu-pandoc
RUN apt-get --assume-yes update
# TODO: remove all pandoc related steps
# RUN apt-get --assume-yes update && apt-get --assume-yes install pandoc=2.9.2.1-3ubuntu2 texlive=2021.20220204-1 texlive-extra-utils=2021.20220204-1
# RUN pandoc --version
# RUN tex --version

# Install python dependencies
RUN apt-get --assume-yes install pip
# Install python-docx
RUN python3 -m pip install python-docx

# Installs Node 16.16.0 LTS with NVM
# FROM ubuntu-pandoc as ubuntu-pandoc-node
RUN apt-get --assume-yes update && apt-get --assume-yes install curl bash
ENV NVM_DIR=/usr/local/nvm
ENV NODE_VERSION=16.16.0
RUN mkdir $NVM_DIR
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="${NVM_DIR}/versions/node/v${NODE_VERSION}/bin/:${PATH}"
RUN node --version
RUN npm --version

# Prepares Modelica dependency scripts
# FROM ubuntu-pandoc-node as alpine-node-modelica
RUN apt-get update && apt-get -y install default-jdk
RUN mkdir dependencies
WORKDIR /app
COPY bin/ bin/
COPY package*.json ./

# Installs Modelica dependencies
RUN apt-get -y install make curl git
RUN npm run install-modelica-deps
WORKDIR /dependencies
ENV MODELICAPATH=/dependencies/ModelicaStandardLibrary:/dependencies/modelica-buildings
RUN mkdir template-json
RUN node modelica-json/app.js -f modelica-buildings/Buildings/Templates -o json -d template-json

# Adds Modelica dependencies to the resulting image
# FROM alpine-node-modelica as ubuntu-pandoc-node-modelica
# COPY --from=alpine-node-modelica /dependencies /dependencies
WORKDIR /app