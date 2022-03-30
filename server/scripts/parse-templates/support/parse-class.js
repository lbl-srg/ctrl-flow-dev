const { getFile } = require("./files.js");
const { extendsElement, extendsComponent } = require("./util.js");

function parseFile(classPath) {
  const fullDef = getFile(classPath);
  const def = fullDef.class_definition[0].class_specifier.long_class_specifier;

  return {
    name: def.description_string,
    id: def.identifier,
    elements: _getElements(def.composition.element_list),
  };
}

function _getElements(elements) {
  const extendClass = elements.find(extendsElement);

  const ret = extendClass
    ? parseFile(extendClass.extends_clause.name).elements.concat(elements)
    : elements.filter((el) => el?.final === true);

  return ret.map(_parseElement);
}

function _parseElement(el) {
  let element = { ...el, components: [] };
  let additionalElements = [];

  if (extendsElement(element)) {
    additionalElements = parseFile(el.extends_clause.name).elements;
  } else if (extendsComponent(element)) {
    additionalElements = parseFile(el.component_clause.type_specifier).elements;
  }

  return element;
}

module.exports = parseFile;
