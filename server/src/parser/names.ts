/**
 * Modelica names, which may contain quoted identifiers (MLS 3.7 §2.3.1)
 *
 * A quoted identifier may contain ".", "-" and escaped quotes, as in 'a.b',
 * 'with-dash' or '13\'H'. Names are therefore never split with a plain string
 * split, but with the scanner below.
 * Specification: docs/selection-keys.md, "Parsing".
 *
 * This file is also imported by the client (client/src/utils/names.ts): it
 * must not import anything.
 */

const UNQUOTED_IDENT = "[a-zA-Z_][a-zA-Z0-9_]*";
const Q_CHAR = `[a-zA-Z0-9_!#$%&()*+,\\-./:;<=>?@[\\]^{}|~ "]`;
const S_ESCAPE = `\\\\['"?\\\\abfnrtv]`;
const Q_IDENT = `'(?:${Q_CHAR}|${S_ESCAPE})+'`;
const IDENT = `(?:${UNQUOTED_IDENT}|${Q_IDENT})`;
const NAME_RE = new RegExp(`^\\.?${IDENT}(?:\\.${IDENT})*$`);

/**
 * Calls `visit` for each character outside quoted identifiers and string
 * literals, and for each quoted identifier or string literal as a whole,
 * quotes included.
 * Throws if a quoted identifier or a string literal is not closed.
 */
function scan(
  text: string,
  visit: (token: string, index: number, quoted: boolean) => void,
) {
  let i = 0;
  while (i < text.length) {
    const quote = text[i];
    if (quote !== "'" && quote !== '"') {
      visit(quote, i, false);
      i++;
      continue;
    }
    let j = i + 1;
    while (j < text.length && text[j] !== quote) {
      j += text[j] === "\\" ? 2 : 1; // skip the escaped character
    }
    if (j >= text.length) {
      const kind = quote === "'" ? "quoted identifier" : "string";
      throw new Error(`Unclosed ${kind} in: ${text}`);
    }
    visit(text.slice(i, j + 1), i, true);
    i = j + 1;
  }
}

/**
 * Returns the indices of `char` outside quoted identifiers and string literals
 */
function indicesOf(text: string, char: string): number[] {
  const indices: number[] = [];
  scan(text, (token, index, quoted) => {
    if (!quoted && token === char) indices.push(index);
  });
  return indices;
}

/** True if `name` is a Modelica name: [ "." ] IDENT { "." IDENT } */
export function isName(name: string): boolean {
  return NAME_RE.test(name);
}

/** True if `ident` is a quoted identifier */
export function isQuotedIdent(ident: string): boolean {
  return ident.startsWith("'");
}

/** True if any identifier of `name` is quoted */
export function hasQuotedIdent(name: string): boolean {
  return splitName(name).some(isQuotedIdent);
}

/**
 * Splits a name into its identifiers, as `name.split(".")` does for a name
 * without quoted identifiers: "a.'b.c'" gives ["a", "'b.c'"].
 */
export function splitName(name: string): string[] {
  const parts: string[] = [];
  let start = 0;
  indicesOf(name, ".").forEach((i) => {
    parts.push(name.slice(start, i));
    start = i + 1;
  });
  parts.push(name.slice(start));
  return parts;
}

/** First identifier of a name */
export function firstIdent(name: string): string {
  return splitName(name)[0];
}

/** Last identifier of a name */
export function lastIdent(name: string): string {
  const idents = splitName(name);
  return idents[idents.length - 1];
}

/**
 * Name without its last `count` identifiers: "a.b.c" gives "a.b", and "" if
 * no identifier is left
 */
export function enclosingName(name: string, count = 1): string {
  return splitName(name).slice(0, -count).join(".");
}

/**
 * Splits a selection key at its first "-" outside quoted identifiers:
 * returns [modelicaPath, instancePath], or [key] for a key without "-"
 */
export function splitSelectionKey(key: string): string[] {
  const [i] = indicesOf(key, "-");
  return i === undefined ? [key] : [key.slice(0, i), key.slice(i + 1)];
}
