FROM node:16-alpine as base

RUN apk update && apk --no-cache add openjdk13
RUN mkdir dependencies
WORKDIR /app
COPY bin/ bin/
COPY package* ./


FROM base as dependencies

RUN apk update && apk --no-cache add make curl git
RUN npm run install-modelica-deps
WORKDIR /dependencies
ENV MODELICAPATH=/dependencies/ModelicaStandardLibrary:/dependencies/modelica-buildings
RUN mkdir template-json
RUN node modelica-json/app.js -f modelica-buildings/Buildings/Templates -o json -d template-json


FROM base as dev-server

COPY --from=dependencies /dependencies /dependencies
