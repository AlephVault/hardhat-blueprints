const defaultArgumentTypes = {
    "typeName": {
        prompt: {
            type: "plus:given-or-valid-input",
            validate: /^[A-Z][A-Za-z0-9_]*$/,
            makeInvalidInputMessage: (v) => `Invalid type name: ${v}`,
            onInvalidGiven: (v) => console.error(`Invalid given type name: ${v}`)
        },
        description: "The PascalCase name of a type"
    },
    "identifier": {
        prompt: {
            type: "plus:given-or-valid-input",
            validate: /^[a-z][A-Za-z0-9_]*$/,
            makeInvalidInputMessage: (v) => `Invalid identifier: ${v}`,
            onInvalidGiven: (v) => console.error(`Invalid given identifier: ${v}`)
        },
        description: "A camelCase identifier"
    },
    "contract": {
        prompt: {
            type: "plus:hardhat:given-or-contract-select"
        },
        description: "The ID of an artifact"
    },
    "numeric-string": {
        prompt: {
            type: "plus:given-or-valid-number-input",
            convert: "string"
        },
        description: "A positive number"
    },
    "integer-string": {
        prompt: {
            type: "plus:given-or-valid-number-input",
            integerOnly: true, allowHex: true,
            convert: "string"
        },
        description: "A positive integer"
    },
    "bigint": {
        prompt: {
            type: "plus:given-or-valid-number-input",
            integerOnly: true, allowHex: true,
            convert: "bigint"
        },
        description: "A positive integer"
    },
    "boolean": {
        prompt: {
            type: "plus:given-or-boolean-select"
        },
        description: "(true or false)"
    },
    "account": {
        prompt: {
            type: "plus:hardhat:given-or-valid-account-input",
            allowAccountIndex: false
        },
        description: "An account index"
    },
    "address": {
        prompt: {
            type: "plus:hardhat:given-or-valid-address-input",
            allowAccountIndex: false
        },
        description: "A checksum address"
    },
    "smart-address": {
        prompt: {
            type: "plus:hardhat:given-or-valid-address-input",
            allowAccountIndex: true
        },
        description: "A checksum address or account index"
    },
    "solidity": {
        prompt: {
            type: "plus:hardhat:given-or-solidity-version-select"
        },
        description: "An X.Y.Z Solidity version in the project"
    }
}

/**
 * Prepares a prompt. It picks a prompt type (or takes it as-is)
 * and adds the other arguments: name, message and given.
 * @param hre The hardhat runtime environment.
 * @param name The internal name of the argument.
 * @param message The display message.
 * @param given The initial given value (optional).
 * @param nonInteractive Flag to tell whether the interaction must
 * not become interactive (by raising an error) or can be.
 * @param argumentType The argument type. Either one of the registered
 * argument types or a custom prompt.
 * @returns {*} The prompt entry.
 */
function preparePrompt(hre, name, message, argumentType, nonInteractive, given) {
    // First, the prompt type is either a textual/registered string
    // or a partial prompt object. Then, the other members are added.
    if (!argumentType) throw new Error("Cannot prepare a prompt with empty type");
    return {name, message, given, ...(hre.blueprints.argTypes[argumentType].prompt || argumentType)};
}

/**
 * Registers a prompt type for the arguments.
 * @param hre The hardhat runtime environment.
 * @param argumentType The name of the prompt type.
 * @param promptSpec The object depicting a prompt (in the same
 * format that would be provided for enquirer's prompt() method).
 * @param description A description of how the type works.
 */
function registerBlueprintArgumentType(hre, argumentType, promptSpec, description) {
    if (hre.blueprints.argTypes[argumentType] !== undefined) {
        throw new Error(`A prompt type is already registered with this name: ${argumentType}`);
    }
    hre.blueprints.argTypes[argumentType] = {prompt: promptSpec, description};
}

/**
 * Prepares all the given arguments into enquirer's prompts.
 * Each element must be {name, message, promptType}.
 * @param hre The hardhat runtime environment.
 * @param arguments The list of argument entries.
 * @param nonInteractive Flag to tell whether the interaction must
 * not become interactive (by raising an error) or can be.
 * @param givenValues An optional set of given values (only one
 * per argument name).
 * @returns {Array} The native prompts.
 */
function prepareArgumentPrompts(hre, arguments, nonInteractive, givenValues) {
    givenValues = givenValues || {};
    return arguments.map(({name, message, argumentType}) => preparePrompt(
        hre, name, message, argumentType, nonInteractive, givenValues[name]
    ));
}

module.exports = {
    prepareArgumentPrompts, registerBlueprintArgumentType, defaultArgumentTypes
}