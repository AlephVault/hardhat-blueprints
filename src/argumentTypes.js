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
        description: "A number"
    },
    "integer-string": {
        prompt: {
            type: "plus:given-or-valid-number-input",
            integerOnly: true, allowHex: true,
            convert: "string"
        },
        description: "A integer"
    },
    "bigint": {
        prompt: {
            type: "plus:given-or-valid-number-input",
            integerOnly: true, allowHex: true,
            convert: "bigint"
        },
        description: "A integer"
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
    "token-amount": {
        prompt: {
            type: "plus:hardhat:given-or-valid-token-amount-input"
        },
        description: "An denominated amount, like 1ether, 1.2gwei, or other standard units"
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
    },
    "string": {
        prompt: {
            type: "plus:given-or-valid-input",
            validate: (v) => true,
            makeInvalidInputMessage: (v) => `Invalid string: ${v}`,
            onInvalidGiven: (v) => console.error(`Invalid given string: ${v}`)
        },
        description: "An arbitrary string"
    },
    "bytes": {
        prompt: {
            type: "plus:given-or-valid-input",
            validate: /^0x([a-fA-F0-9]{2})*$/,
            makeInvalidInputMessage: (v) => `Invalid string: ${v}`,
            onInvalidGiven: (v) => console.error(`Invalid given string: ${v}`)
        },
        description: "An arbitrary string"
    },
    "hashed-text": {
        prompt: {
            type: "plus:hardhat:given-or-valid-hashed-input"
        },
        description: "A free text to be hashed"
    },
    "hashed": {
        prompt: {
            type: "plus:hardhat:given-or-valid-smart-hashed-input"
        },
        description: "A free text to be hashed, or a valid already-computed hash"
    }
}

for(let index = 1; index <= 32; index++) {
    defaultArgumentTypes[`bytes${index}`] = {
        prompt: {
            type: "plus:given-or-valid-input",
            validate: new RegExp("^0x[a-fA-F0-9]{" + (2 * index) + "}$"),
            makeInvalidInputMessage: (v) => `Invalid bytes${index} value: ${v}`,
            onInvalidGiven: (v) => console.error(`Invalid given bytes${index} value: ${v}`)
        },
        description: `A byte-aligned hexadecimal string of length ${index}`
    }

    defaultArgumentTypes[`int${index * 8}`] = {
        prompt: {
            type: "plus:given-or-valid-number-input", convert: "bigint",
            integerOnly: true, allowHex: true,
            min: (-(1n << BigInt(index * 8 - 1))).toString(),
            max: ((1n << BigInt(index * 8 - 1)) - 1n).toString(),
        },
        description: `An int${index * 8}-ranged number`
    }

    defaultArgumentTypes[`uint${index * 8}`] = {
        prompt: {
            type: "plus:given-or-valid-number-input", convert: "bigint",
            integerOnly: true, allowHex: true,
            min: "0", max: ((1n << BigInt(index * 8 )) - 1n).toString(),
        },
        description: `An uint${index * 8}-ranged number`
    }
}

/**
 * Gets the prompt to use from an argument type.
 * @param hre The hardhat runtime environment.
 * @param argumentType The argument type.
 * @returns {{type}|*} The prompt spec.
 */
function getPrompt(hre, argumentType) {
    if (typeof argumentType === "string") {
        const prompt = hre.blueprints.argTypes[argumentType]?.prompt;
        if (!prompt) {
            throw new Error(`Unknown argument type name: ${argumentType}`);
        }
        return prompt;
    } else {
        if (!argumentType?.type){
            throw new Error(`Invalid one-off argument type spec: ${argumentType}`);
        }
        return argumentType;
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
    return {name, message, nonInteractive, given, ...getPrompt(hre, argumentType)};
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
 * Makes an array applier to be used in an array prompt.
 * @param hre The hardhat runtime environment.
 * @param message The message (which can contain an ${index} chunk
 * to insert the index in the message). It is optional.
 * @param argumentType The argument type for the element.
 * @returns {function(*, *, *): Promise<"anyfunc"|"externref">} The applier.
 */
function arrayApplier(hre, {message, argumentType}) {
    if (!argumentType) {
        throw new Error("The argumentType must be set when creating an array argument");
    }
    const prompt = preparePrompt(
        hre, "element", message, argumentType, false, ""
    );
    return async function(index, given, nonInteractive) {
        return (await hre.enquirerPlus.Enquirer.prompt([{
            ...prompt, given, nonInteractive, message: message?.replace("${index}", index) || `Element #${index}`
        }])).element;
    }
}

/**
 * Builds an argument of type Array.
 * @param hre The hardhat runtime environment.
 * @param message The message for the argument.
 * @param description The description for the argument.
 * @param name The name for the argument.
 * @param length The length (optional; it must be a non-negative
 * number for a fixed-length array, or undefined for a prompted
 * length array).
 * @param elements A {message, argumentType} element. The message
 * can have a ${index} tag which will be replaced with the actual
 * index, and the argumentType or prompt spec for each element.
 * @returns {*} The structure for an argument of array type.
 */
function arrayArgument(hre, {message, description, name, length, elements}) {
    return {
        name, description, message, argumentType: {
            type: "plus:given-or-array", length, applier: arrayApplier(hre, elements || {})
        }
    }
}

/**
 * Makes many tuple appliers to be used in a tuple prompt.
 * @param hre The hardhat runtime environment.
 * @param elements A list of {name, message, argumentType}
 * elements, each for a member of the tuple. If the message
 * is not given but the name is given, ".{name} member" will
 * be the new message.
 * @param elements The specs for each element in the tuple.
 */
function tupleAppliers(hre, elements) {
    return (elements || []).map((element) => {
        let {name, message, argumentType} = element || {};
        if (!message && name) {
            message = `.${name} member`
        }
        const prompt = preparePrompt(
            hre, name, message, argumentType, false, ""
        );
        return async function(index, given, nonInteractive) {
            return (await hre.enquirerPlus.Enquirer.prompt([{
                ...prompt, given, nonInteractive, message: message || `#${index} member`, name: "element"
            }])).element;
        }
    });
}

/**
 * Builds an argument of type Tuple.
 * @param hre The hardhat runtime environment.
 * @param message The message for the argument.
 * @param description The description for the argument.
 * @param name The name for the argument.
 * @param elements A [{name, message, argumentType}, ...] element.
 * @returns {*} The structure for an argument of array type.
 */
function tupleArgument(hre, {message, description, name, elements}) {
    return {
        name, description, message, argumentType: {
            type: "plus:given-or-tuple", appliers: tupleAppliers(hre, elements || {})
        }
    }
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
    prepareArgumentPrompts, registerBlueprintArgumentType, defaultArgumentTypes,
    arrayArgument, tupleArgument
}