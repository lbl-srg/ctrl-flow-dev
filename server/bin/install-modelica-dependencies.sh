#!/bin/sh
set -x

cd dependencies
git clone -b issue1374_templates --single-branch --depth 1 https://github.com/lbl-srg/modelica-buildings.git
git clone -b issue157_updateSimJsonStructure --single-branch --depth 1 https://github.com/lbl-srg/modelica-json.git
git clone -b v3.2.3+build.4 --single-branch --depth 1 https://github.com/modelica/ModelicaStandardLibrary.git

cd modelica-json
make install
make compile