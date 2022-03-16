export function isInViewPort($el: Element): boolean {
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

export function scrollToSelector(selector: string): void {
  const $el: HTMLElement | null = document.querySelector(selector);
  if ($el) $el.scrollIntoView({ behavior: "smooth" });
}

export function getAll(selector: string): HTMLElement[] {
  return Array.from(document.querySelectorAll(selector));
}

export function getNumericId($el: Element): number | null {
  const idStr = $el.getAttribute("id") || "";
  const [str, val] = idStr.split("-");
  return val ? Number(val) : null;
}

export function getFormData($form: HTMLFormElement): object {
  const formData = Array.from(new FormData($form).entries());
  return formData.reduce((ret, [key, val]) => {
    return { ...ret, [key]: val };
  }, {});
}
