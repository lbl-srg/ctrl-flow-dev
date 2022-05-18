#!/bin/sh

DEST="/tmp/test-linkage-widget/"
[ -d "$DEST" ] || mkdir "$DEST"

convert() {
  node ../dependencies/modelica-json/app.js -f $1 -o json -d $DEST
}

convert tests/static-data/TestPackage