const { getFile } = require("./files.js");
const {
  extendsElement,
  extendsComponent,
  getClassDef,
  notFinal,
} = require("./util.js");

function parseElements(filePath) {
  const {
    composition: { element_list: elements },
  } = getClassDef(getFile(filePath));

  const extendClass = elements.find(extendsElement);

  const ret = extendClass
    ? parseElements(extendClass.extends_clause.name).concat(elements)
    : elements;

  return ret.filter(notFinal).map(_parseElement);
}

function _parseElement(el) {
  let element = { ...el, components: [] };
  let additionalElements = [];

  if (extendsElement(element)) {
    additionalElements = parseElements(el.extends_clause.name);
  } else if (extendsComponent(element)) {
    additionalElements = parseElements(el.component_clause.type_specifier);
  }

  additionalElements.forEach(
    (addOn) =>
      (element.components = element.componets.concat(addOn.component_list)),
  );

  return element;
}

module.exports = parseElements;
