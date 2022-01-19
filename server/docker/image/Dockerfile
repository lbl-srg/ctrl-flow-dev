FROM node:16-alpine as base

RUN apk update && apk --no-cache add openjdk13
WORKDIR /app
COPY . .


FROM base as dependencies

RUN apk update && apk --no-cache add make curl git
RUN npm run install-modelica-deps


FROM base as dev-server

COPY --from=dependencies /app/node_modules /app/node_modules
COPY --from=dependencies /app/dependencies /app/dependencies
