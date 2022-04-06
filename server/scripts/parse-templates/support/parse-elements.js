const _ = require("lodash");
const parseComponents = require("./parse-components.js");

const {
  extendsElement,
  extendsComponent,
  getClassDef,
  notFinal,
} = require("./util.js");

function parseElements(elements) {
  const ret = elements;

  const extendClass = elements.find(extendsElement);

  // extendClass
  //   ? parseElements(extendClass.extends_clause.name).concat(elements)
  //   : elements;

  return ret
    .filter(notFinal)
    .filter((el) => !extendsElement(el))
    .map(_parseElement);
  // .map(_parseElement);
}

function _parseElement(el) {
  return {
    description: el?.description?.description_string,
    components: parseComponents(el?.component_clause?.component_list),
    // constraints: el?.constraining_clause,
    orig: el,
  };

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
