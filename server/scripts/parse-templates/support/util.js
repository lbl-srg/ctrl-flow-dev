module.exports = {
  extendsElement(el) {
    return "extends_clause" in el;
  },

  extendsComponent(el) {
    return (
      "component_clause" in el &&
      typeof el.component_clause.type_specifier === "string" &&
      el.component_clause.type_specifier.startsWith("Buildings") // TODO: janky...
    );
  },

  getClassDef(fullJSON) {
    return fullJSON.class_definition[0].class_specifier.long_class_specifier;
  },

  notFinal(el) {
    return el?.final !== true;
  },
};
