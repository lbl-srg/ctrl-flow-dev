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

/**
 * Translated files append an absolute path to where the file is stored on the server.
 * Removes 'modelicaPath' and 'fullMoFilePath' as this path is randomized on the backend
 * TODO: what are these file paths for? Can it be removed? Reporting absolute server
 * paths back is probably not a good idea.
 * @param o: object
 * @returns string 
 */
export const stripFilePaths: (o: any) => string = (o) => {
    const {modelicaFile, fullMoFilePath, ...noPathsParsed} = o;

    return JSON.stringify(noPathsParsed);
}