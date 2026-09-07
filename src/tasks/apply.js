import { installBlueprints } from "../index.js";

export default async function ({template, nonInteractive, outputFile, params}, hre) {
    installBlueprints(hre);

    try {
        const given = {};
        (params || []).forEach((param) => {
            const [key, ...parts] = param.split("=");
            const value = parts.join("=");
            if (value !== "") {
                given[key] = value;
            }
        });
        const key = await new hre.enquirerPlus.Enquirer.GivenOrSelect({
            message: "Which template do you want to apply?",
            given: template, nonInteractive, choices: hre.blueprints.list,
            onInvalidGiven: () => console.error(`Unknown template: ${template}`),
        }).run();
        const filename = await hre.blueprints.applyBlueprint(key, nonInteractive, given, outputFile);
        console.log(`File ${filename} successfully generated.`);
    } catch (e) {
        console.error(e);
        process.exitCode = 1;
    }
}
