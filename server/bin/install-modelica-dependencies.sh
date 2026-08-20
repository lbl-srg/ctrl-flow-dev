#!/bin/sh
set -x

MODELICA_BUILDINGS_COMMIT=b399379315641da39b231033b0660100fd6489a5
MODELICA_STANDARD_TAG=v4.0.0 # This should be driven by 'uses' annotation from Buildings/package.mo
MODELICA_JSON_COMMIT=81d90dac01cce41cbb80f7b0171c673dbcd7788a

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

git clone -b $MODELICA_STANDARD_TAG --single-branch --depth 1 https://github.com/modelica/ModelicaStandardLibrary.git

cd modelica-json
make install
make compile
