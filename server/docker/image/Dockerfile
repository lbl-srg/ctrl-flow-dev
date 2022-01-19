FROM node:16-alpine as base

RUN apk update && apk --no-cache add openjdk13
RUN mkdir dependencies
WORKDIR /app
COPY bin/ bin/
COPY package* .


FROM base as dependencies

RUN apk update && apk --no-cache add make curl git
RUN npm run install-modelica-deps


FROM base as dev-server

COPY --from=dependencies /dependencies /dependencies
