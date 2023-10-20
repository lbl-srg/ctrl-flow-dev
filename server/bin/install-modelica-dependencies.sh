#!/bin/sh
set -x

MODELICA_BUILDINGS_COMMIT=cdd3fe8f4db0feaf821eb0f61c4d05635d98e957
MODELICA_JSON_COMMIT=a46a361c3047c0a2b3d1cfc9bc8b0a4ced16006a

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

# Clone modelica buildings commit -
cd ../dependencies
git clone https://github.com/lbl-srg/modelica-buildings.git
cd modelica-buildings
git checkout $MODELICA_BUILDINGS_COMMIT
cd -

# Clone modelica-json commit
git clone https://github.com/lbl-srg/modelica-json.git
cd modelica-json
git checkout $MODELICA_JSON_COMMIT
cd -

git clone -b v3.2.3+build.4 --single-branch --depth 1 https://github.com/modelica/ModelicaStandardLibrary.git

cd modelica-json
git apply $parent_path/bin/maven-install.patch
make install
make compile
