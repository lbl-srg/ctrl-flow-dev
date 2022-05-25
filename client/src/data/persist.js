import npmPkg from "../../package.json";
const storageKey = `lbl-storage-v${npmPkg.version}`;

const _getLocal = () => {
  const str = window.localStorage.getItem(storageKey) || "{}";
  return JSON.parse(str);
};

export default {
  get storage() {
    return _getLocal;
  },

  set storage(val) {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        ..._getLocal(),
        ...val,
      }),
    );
  },
};
