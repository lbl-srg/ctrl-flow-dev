/**
 * Option Visualizer helper
 */

const DebugTree = require("debug-tree");
const templateData = require("./templates.json");

DebugTree.start("output.html");

const path = "Buildings.Templates.AirHandlersFans.VAVMultiZone";
const options = templateData["options"];
const optionMap = {};
options.map((o) => (optionMap[o.modelicaPath] = o));

const isPrimitive = (o) => {
  const type = o.type;
  return (
    type && (type.startsWith("Medium") || ["Boolean", "String"].includes(type))
  );
};

const writeNode = (nodePath, depth = 0) => {
  const node = optionMap[nodePath];
  // if (node?.visible && !isPrimitive(node)) {
  console.log(DebugTree.depth(depth), `${node?.name}\t\t${node?.modelicaPath}`);
  // }

  node?.options?.map((oPath) => {
    const o = optionMap[oPath];
    const newDepth = o?.visible ? depth + 1 : depth;
    writeNode(oPath, depth + 1);
  });
};

writeNode(path);

DebugTree.end();
