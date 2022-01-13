FROM node:16-alpine as base

RUN apk update && apk --no-cache add openjdk13 make curl git
WORKDIR /dependencies
RUN git clone -b issue1374_templates --single-branch --depth 1 https://github.com/lbl-srg/modelica-buildings.git\
    && git clone -b issue157_updateSimJsonStructure --single-branch --depth 1 https://github.com/lbl-srg/modelica-json.git\
    && git clone -b v3.2.3+build.4 --single-branch --depth 1 https://github.com/modelica/ModelicaStandardLibrary.git
RUN cd modelica-json && make install && make compile
EXPOSE 3000
WORKDIR /app
