declare module "@modelica-json/parser" {
    export function getJsons(moFiles: string[],
        parseMode: string,
        outputFormat: 'raw-json' | 'json' | 'html' | 'docx',
        directory: string, prettyPrint:
        boolean
    ): any[];

    export function convertToModelica(
        jsonFile: string,
        outDir: string,
        rawJson?: boolean,
    ): string;
}
