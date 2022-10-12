import fs from "fs";
import path from "path";

const templateData = require("./templates.json");

const { options, scheduleOptions } = templateData;

const mergedOptions = [
	...options,
	...scheduleOptions,
];

const getFinalPathing = (path) => {
	return path.split('.').at(-1);
}

const cleanOptions = (optionArray) => {
	return optionArray?.map((o) => getFinalPathing(o)) || [];
}

const optionsData = mergedOptions.map((o) => {
	return {
		modelicaPath: o.modelicaPath || '',
		name: o.name || '',
		type: getFinalPathing(o.type) || '',
		group: o.group || '',
		options: JSON.stringify(cleanOptions(o.options)),
	}
});

const fields = Object.keys(optionsData[0]);
let csv = optionsData.map((row) => {
	return fields.map((name) => {
		return JSON.stringify(row[name])
	}).join(',');
});

csv.unshift(fields.join(','));
csv = csv.join('\r\n');

const dest = path.resolve(
  `${__dirname}/modelicaPaths.csv`,
);

fs.writeFileSync(dest, csv);