#!/bin/sh
set -x

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

cd ../dependencies
git clone -b issue1374_templates --single-branch https://github.com/lbl-srg/modelica-buildings.git
git clone -b issue157_updateSimJsonStructure --single-branch --depth 1 https://github.com/lbl-srg/modelica-json.git
git clone -b v3.2.3+build.4 --single-branch --depth 1 https://github.com/modelica/ModelicaStandardLibrary.git

# TODO: remove patching
cd modelica-buildings
git checkout 6b5f7355d18c2484a63c1a2576e1a05c4fed6c06
git apply $parent_path/bin/linkage-keyword.patch

cd ../modelica-json
git apply $parent_path/bin/ignore-cert.patch
make install
make compile
