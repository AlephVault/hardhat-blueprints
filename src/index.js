const {scope} = require("hardhat/config");
const {registerBlueprintArgumentType} = require("./prompts");
const {registerBlueprint, executeBlueprint, blueprintsList} = require("./blueprints");

const scope_ = scope("blueprint");

scope_
    .task("apply", "Picks and applies a template")
    .addOptionalPositionalParam("template", "The template key to apply")
    .addFlag("nonInteractive", "Ensure this execution is not interactive (raising an error when it becomes interactive)")
    .addOptionalVariadicPositionalParam("params", "Many (variadic) arguments like ARG=value (quote the pair properly) that will be used in the template")
    .setAction(async ({template, nonInteractive, params}, hre, runSuper) => {
        try {
            const given = {};
            (params || []).forEach((param) => {
                const [key, ...parts] = param.split("=");
                const value = parts.join("=");
                if (value !== "") {
                    given[key] = value;
                }
            });
            given["SCRIPT_NAME"] = template;
            const key = await new hre.enquirerPlus.Enquirer.GivenOrContractSelect({
                given: template, nonInteractive,
                onInvalidGiven: (v) => console.error(`Unknown template: ${template}`)
            }).run();
            await executeBlueprint(hre, key, nonInteractive);
        } catch (e) {
            console.error(e);
        }
    });

module.exports = {
    registerBlueprintArgumentType, registerBlueprint,
}