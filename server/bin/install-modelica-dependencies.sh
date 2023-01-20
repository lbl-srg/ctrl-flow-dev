#!/bin/sh
set -x

MODELICA_BUILDINGS_COMMIT=e70218d39e3f83402caa87100df426d754e56766
MODELICA_JSON_COMMIT=4160382a4914c14f38889f2d49924ffe0cda47ea

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

# TODO: remove patching
cd modelica-buildings
git apply $parent_path/bin/linkage-keyword.patch

cd ../modelica-json
git apply $parent_path/bin/maven-install.patch
make install
make compile
