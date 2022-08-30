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
  const type = o?.type;
  return (
    type &&
    (type.startsWith("Medium") || ["String", "Integer", "Real"].includes(type))
  );
};

const writeNode = (nodePath, mods = {}, depth = 0) => {
  const node = optionMap[nodePath];
  const type = node?.type;
  const mod = type ? mods[type] : null;
  const visible =
    mod?.final !== undefined ? node?.visible && mod.final : node?.visible;
  // check the mod back for final
  let printStr = visible ? `** - ${node?.name}` : `${node?.name}`;
  if (!isPrimitive(node)) {
    console.log(DebugTree.depth(depth), printStr);
  }

  node?.options?.map((oPath) => {
    const o = optionMap[oPath];
    const newMods = o?.modifiers ? { ...o.modifiers, ...mods } : mods;
    writeNode(oPath, newMods, depth + 1);
  });
};

writeNode(path);

DebugTree.end();
