const { getFile } = require("./files.js");

module.exports = function (filePath) {
  const data = getFile(filePath);

  return _flat(data);
};

function _flat(item) {
  if (Array.isArray(item)) return item.map(_flat);

  return Object.entries(item).reduce(
    (ret, [key, val]) => {
      // console.log(key);

      if (key === "extends_clause") {
        ret[key] = _flat(getFile(val.name));
      } else if (key === "type_specifier" && val.startsWith("Buildings.")) {
        ret[key] = _flat(getFile(val));
      } else if (typeof val === "object") {
        ret[key] = _flat(val);
      }

      return ret;
    },
    { ...item },
  );
}
