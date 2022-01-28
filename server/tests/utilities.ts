/**
 * Translated files do not necessarily match the original MO file spacing. This
 * extracts all newlines and spaces so non-spacing related characters can be compared
 * @param str: the string to strip
 * 
 * @returns the stripped string
 */
export const stripSpacing: (str: string) => string = (str) => {
    return str.replace(/[\s\r\n]+/g, '')
};
