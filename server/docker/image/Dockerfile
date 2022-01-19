FROM node:16-alpine as base

RUN apk update && apk --no-cache add openjdk13
WORKDIR /app
RUN mkdir dependencies
COPY bin/ bin/
COPY package* .


FROM base as dependencies

RUN apk update && apk --no-cache add make curl git
RUN npm run install-modelica-deps


FROM base as dev-server

COPY --from=dependencies /app/dependencies /app/dependencies
RUN npm install
