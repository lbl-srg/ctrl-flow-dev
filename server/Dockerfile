# Installs Pandoc, TexLive, and make4ht on a Ubuntu Linux distribution
FROM ubuntu:26.04

RUN apt-get --assume-yes update && apt-get --assume-yes install curl bash
ENV NVM_DIR=/usr/local/nvm
ENV NODE_VERSION=24.22.3
RUN mkdir $NVM_DIR
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
RUN . "$NVM_DIR/nvm.sh" && nvm install ${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm use v${NODE_VERSION}
RUN . "$NVM_DIR/nvm.sh" && nvm alias default v${NODE_VERSION}
ENV PATH="${NVM_DIR}/versions/node/v${NODE_VERSION}/bin/:${PATH}"
RUN node --version
RUN npm --version

# Prepares Modelica dependency scripts
RUN apt-get update
RUN mkdir dependencies
WORKDIR /server
COPY bin/ bin/
COPY package*.json ./

# Install python dependencies
# The system Python is externally managed (PEP 668): the dependencies are
# installed in a virtual environment, first on PATH so that `python3` is the
# one of the environment, also when the server runs the sequence document
RUN apt-get update --assume-yes && apt-get upgrade --assume-yes
RUN apt-get --assume-yes install python3-venv
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:${PATH}"
COPY scripts/ctrlflow scripts/ctrlflow
COPY scripts/sequence-doc scripts/sequence-doc
RUN npm run install-python-deps

# Installs Modelica dependencies
RUN apt-get -y install make curl git
RUN npm run install-modelica-deps
WORKDIR /dependencies
ENV MODELICAPATH=/dependencies/ModelicaStandardLibrary:/dependencies/modelica-buildings
RUN mkdir template-json
RUN node modelica-json/app.js --input modelica-buildings/Buildings/Templates --output json --directory template-json --exclude '**.(Validation|Examples)'

WORKDIR /server

# Copy the rest of the server app
# Network calls to the npm registry occasionally get reset inside Docker's
# build network (ECONNRESET/"network aborted"). Increase npm's retry count
# and backoff timeouts so transient blips don't fail the whole image build.
RUN npm i \
  --fetch-retries=5 \
  --fetch-retry-factor=2 \
  --fetch-retry-mintimeout=20000 \
  --fetch-retry-maxtimeout=120000
COPY . .

RUN npm run parseTemplateJSON

RUN npm run build
RUN npx webpack

ARG PORT

# Needed to keep rdflib (modelica-json dep) out of project's dependencies
# but Node still requires it at runtime for some reason.
ENV NODE_PATH=/dependencies/modelica-json/node_modules

# For when image is run
CMD ["node", "dist/index.js"]
EXPOSE ${PORT}
