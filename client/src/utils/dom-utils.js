export function isInViewPort($el) {
  const bounding = $el.getBoundingClientRect();

  if (
    bounding.top >= 0 &&
    bounding.left >= 0 &&
    bounding.right <=
      (window.innerWidth || document.documentElement.clientWidth) &&
    bounding.bottom <=
      (window.innerHeight || document.documentElement.clientHeight)
  ) {
    return true;
  } else {
    return false;
  }
}

export function scrollToSelector(selector) {
  const $el = document.querySelector(selector);
  if ($el) $el.scrollIntoView({ behavior: "smooth" });
}

export function getAll(selector) {
  return Array.from(document.querySelectorAll(selector));
}

export function getNumericId($el) {
  const idStr = $el.getAttribute("id") || "";
  const [str, val] = idStr.split("-");
  return val ? Number(val) : null;
}

export function getPath($el) {
  const idStr = $el.getAttribute("id") || "";
  return idStr.split("-")[1];
}

export function getFormData($form) {
  const formData = Array.from(new FormData($form).entries());
  return formData.reduce((ret, [key, val]) => {
    return { ...ret, [key]: val };
  }, {});
}
