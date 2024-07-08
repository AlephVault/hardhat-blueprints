const {scope} = require("hardhat/config");
const {registerBlueprintArgumentType} = require("./prompts");
const {registerBlueprint, executeBlueprint, blueprintsList, blueprints} = require("./blueprints");
const path = require("path");

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
            const key = await new hre.enquirerPlus.Enquirer.GivenOrSelect({
                given: template, nonInteractive, choices: blueprintsList,
                onInvalidGiven: (v) => console.error(`Unknown template: ${template}`)
            }).run();
            await executeBlueprint(hre, key, nonInteractive, given);
        } catch (e) {
            console.error(e);
        }
    });

scope_
    .task("list", "Lists all the available blueprints")
    .setAction(({}, hre, runSuper) => {
        console.log("These are the available blueprints you can use in the `apply` command:");
        blueprintsList.forEach(({name, message}) => {
            console.log(`- ${name}: ${message}\n  - Arguments:`)
            blueprints[name].arguments.forEach((argument) => {
                console.log(`    - ${argument.name}: ${argument.description || 'No description'}`);
            })
        });
    });

const __templates = path.resolve(__dirname, "..", "data", "templates");

registerBlueprint(
    "contract", "MyContract", "An empty contract",
    path.resolve(__templates, "solidity", "Contract.sol.template"),
    "solidity", [
        {
            name: "SOLIDITY_VERSION",
            description: "The Solidity version for the new file",
            message: "Choose the solidity version for this file",
            promptType: "solidity"
        }
    ]
);
registerBlueprint(
    "interface", "MyInterface", "An empty interface",
    path.resolve(__templates, "solidity", "Interface.sol.template"),
    "solidity", [
        {
            name: "SOLIDITY_VERSION",
            description: "The Solidity version for the new file",
            message: "Choose the solidity version for this file",
            promptType: "solidity"
        }
    ]
);
registerBlueprint(
    "library", "MyLibrary", "An empty library",
    path.resolve(__templates, "solidity", "Library.sol.template"),
    "solidity", [
        {
            name: "SOLIDITY_VERSION",
            description: "The Solidity version for the new file",
            message: "Choose the solidity version for this file",
            promptType: "solidity"
        }
    ]
);
registerBlueprint(
    "existing-contract-deployment-module", "MyModule",
    "An ignition module for an existing contract (by artifact ID and contract address)",
    path.resolve(__templates, "ignition-modules", "existing-contract.js.template"),
    "ignition-module", [
        {
            name: "CONTRACT_NAME",
            description: "The ID of a compiled contract artifact",
            message: "Choose one of your contract artifacts",
            promptType: "contract"
        },
        {
            name: "CONTRACT_ADDRESS",
            description: "The address where the contract is deployed",
            message: "Tell the address where the contract is located at",
            promptType: "address"
        }
    ]
);
registerBlueprint(
    "new-contract-deployment-module", "MyModule",
    "An ignition module for a new contract (by artifact ID)",
    path.resolve(__templates, "ignition-modules", "new-contract.js.template"),
    "ignition-module", [
        {
            name: "CONTRACT_NAME",
            description: "The ID of a compiled contract artifact",
            message: "Choose one of your contract artifacts",
            promptType: "contract"
        }
    ]
);

module.exports = {
    registerBlueprintArgumentType, registerBlueprint,
}