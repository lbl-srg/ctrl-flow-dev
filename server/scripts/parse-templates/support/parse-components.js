module.exports = function (components) {
  return components.map(_parseComponent);
};

function _parseComponent(component) {
  return {
    id: component?.declaration?.identifier,
    description: component?.description?.description_string,
  };
}
