#!/bin/sh
set -x

MODELICA_BUILDINGS_COMMIT=b0774846b2c09ee674bca84a4f0a19c1ddc5f4e1
MODELICA_STANDARD_TAG=v4.1.0 # This should be driven by 'uses' annotation from Buildings/package.mo
MODELICA_JSON_COMMIT=9c7e7d99e4899492211fa90a1a3ee95fbf587316

# Shallow-fetch modelica-buildings at a specific commit
cd ../dependencies
mkdir modelica-buildings
cd modelica-buildings
git init -q
git remote add origin https://github.com/lbl-srg/modelica-buildings.git
git fetch --depth 1 origin $MODELICA_BUILDINGS_COMMIT
git checkout -q FETCH_HEAD
cd -

# Shallow-fetch modelica-json at a specific commit
mkdir modelica-json
cd modelica-json
git init -q
git remote add origin https://github.com/lbl-srg/modelica-json.git
git fetch --depth 1 origin $MODELICA_JSON_COMMIT
git checkout -q FETCH_HEAD
cd -

git clone -b $MODELICA_STANDARD_TAG --single-branch --depth 1 https://github.com/modelica/ModelicaStandardLibrary.git

cd modelica-json
make install
