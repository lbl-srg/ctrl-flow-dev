#!/bin/sh

DEST="build/modelica-json"
[ -d "$DEST" ] || mkdir "$DEST"

convert() {
  node ../dependencies/modelica-json/app.js -f ../dependencies/modelica-buildings/Buildings/$1.mo -o json -d $DEST
}

convert Templates/AirHandlersFans/VAVMultiZone
convert Fluid/Interfaces/PartialTwoPortInterface
convert Templates/AirHandlersFans/Interfaces/PartialAirHandler
convert Templates/Components/Sensors/Temperature
convert Templates/Components/Sensors/Interfaces/PartialSensor
convert Templates/AirHandlersFans/Types
convert Fluid/Interfaces/PartialTwoPort
convert Controls/OBC/CDL/Interfaces/RealOutput