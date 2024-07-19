const {scope, extendEnvironment} = require("hardhat/config");
const {registerBlueprintArgumentType, defaultArgumentTypes, prepareArgumentPrompts, tupleArgument, arrayArgument} = require("./argumentTypes");
const {registerBlueprint, applyBlueprint} = require("./blueprints");
const path = require("path");
const {registerHashedInput} = require("./hashed");

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
                message: "Which template do you want to apply?",
                given: template, nonInteractive, choices: hre.blueprints.list,
                onInvalidGiven: (v) => console.error(`Unknown template: ${template}`)
            }).run();
            const filename = await hre.blueprints.applyBlueprint(key, nonInteractive, given);
            console.log(`File ${filename} successfully generated.`);
        } catch (e) {
            console.error(e);
        }
    });

scope_
    .task("list", "Lists all the available blueprints")
    .setAction(({}, hre, runSuper) => {
        console.log("These are the available blueprints you can use in the `apply` command:");
        hre.blueprints.list.forEach(({name, message}) => {
            console.log(`- ${name}: ${message}\n  - Arguments:`)
            hre.blueprints.map[name].arguments.forEach((argument) => {
                console.log(`    - ${argument.name}: ${argument.description || 'No description'} (${(hre.blueprints.argTypes[argument.argumentType] || {}).description || "unknown"})`);
            })
        });
    });

const __templates = path.resolve(__dirname, "..", "data", "templates");

extendEnvironment((hre) => {
    registerHashedInput(hre);

    hre.blueprints ||= {
        map: {},
        list: [],
        argTypes: {...defaultArgumentTypes},
        registerBlueprint: (key, defaultName, title, filePath, scriptType, arguments) => registerBlueprint(
            hre, key, defaultName, title, filePath, scriptType, arguments
        ),
        registerBlueprintArgumentType: (argumentType, promptSpec, description) => registerBlueprintArgumentType(
            hre, argumentType, promptSpec, description
        ),
        prepareArgumentPrompts: (arguments, nonInteractive, givenValues) => prepareArgumentPrompts(
            hre, arguments, nonInteractive, givenValues
        ),
        applyBlueprint: (key, nonInteractive, givenValues) => applyBlueprint(
            hre, key, nonInteractive, givenValues
        ),
        tupleArgument: ({message, description, name, elements}) => tupleArgument(
            hre, {message, description, name, elements}
        ),
        arrayArgument: ({message, description, name, length, elements}) => arrayArgument(
            hre, {message, description, name, length, elements}
        )
    };

    hre.blueprints.registerBlueprint(
        "contract", "MyContract", "An empty contract",
        path.resolve(__templates, "solidity", "Contract.sol.template"),
        "solidity", [
            {
                name: "SOLIDITY_VERSION",
                description: "The Solidity version for the new file",
                message: "Choose the solidity version for this file",
                argumentType: "solidity"
            }
        ]
    );
    hre.blueprints.registerBlueprint(
        "interface", "MyInterface", "An empty interface",
        path.resolve(__templates, "solidity", "Interface.sol.template"),
        "solidity", [
            {
                name: "SOLIDITY_VERSION",
                description: "The Solidity version for the new file",
                message: "Choose the solidity version for this file",
                argumentType: "solidity"
            }
        ]
    );
    hre.blueprints.registerBlueprint(
        "library", "MyLibrary", "An empty library",
        path.resolve(__templates, "solidity", "Library.sol.template"),
        "solidity", [
            {
                name: "SOLIDITY_VERSION",
                description: "The Solidity version for the new file",
                message: "Choose the solidity version for this file",
                argumentType: "solidity"
            }
        ]
    );
    hre.blueprints.registerBlueprint(
        "existing-contract-deployment-module", "MyModule",
        "An ignition module for an existing contract (by artifact ID and contract address)",
        path.resolve(__templates, "ignition-modules", "existing-contract.js.template"),
        "ignition-module", [
            {
                name: "CONTRACT_NAME",
                description: "The type to use for the contract",
                message: "Choose one of your contract artifacts",
                argumentType: "contract"
            },
            {
                name: "CONTRACT_ADDRESS",
                description: "The address where the contract is deployed",
                message: "Tell the address where the contract is located at",
                argumentType: "address"
            }
        ]
    );
    hre.blueprints.registerBlueprint(
        "new-contract-deployment-module", "MyModule",
        "An ignition module for a new contract (by artifact ID)",
        path.resolve(__templates, "ignition-modules", "new-contract.js.template"),
        "ignition-module", [
            {
                name: "CONTRACT_NAME",
                description: "The type to use for the contract",
                message: "Choose one of your contract artifacts",
                argumentType: "contract"
            }
        ]
    );
});

module.exports = {}