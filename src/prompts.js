let prompts = {
    "contractName": {
        type: "plus:given-or-valid-input",
        validate: /^[A-Z][A-Za-z0-9_]*$/,
        makeInvalidInputMessage: (v) => `Invalid contract name: ${v}`,
        onInvalidGiven: (v) => console.error(`Invalid given contract name: ${v}`)
    },
    "identifier": {
        type: "plus:given-or-valid-input",
        validate: /^[a-z][A-Za-z0-9_]*$/,
        makeInvalidInputMessage: (v) => `Invalid identifier: ${v}`,
        onInvalidGiven: (v) => console.error(`Invalid given identifier: ${v}`)
    },
    "number": {
        type: "plus:given-or-valid-number-input",
        convert: "string"
    },
    "integer": {
        type: "plus:given-or-valid-number-input",
        integerOnly: true, allowHex: true,
        convert: "string"
    },
    "boolean": {
        type: "plus:given-or-boolean-select",
    },
    "address": {
        type: "plus:hardhat:given-or-valid-address-input",
        allowAccountIndex: false
    },
    "smart-address": {
        type: "plus:hardhat:given-or-valid-address-input",
        allowAccountIndex: true
    }
}

/**
 * Prepares a prompt. It picks a prompt type (or takes it as-is)
 * and adds the other arguments: name, message and given.
 * @param name The internal name of the argument.
 * @param message The display message.
 * @param given The initial given value (optional).
 * @param nonInteractive Flag to tell whether the interaction must
 * not become interactive (by raising an error) or can be.
 * @param promptType The prompt type. Either one of the registered
 * prompt types.
 * @returns {*} The prompt entry.
 */
function preparePrompt(name, message, promptType, nonInteractive, given) {
    // First, the prompt type is either a textual/registered string
    // or a partial prompt object. Then, the other members are added.
    if (!promptType) throw new Error("Cannot prepare a prompt with empty type");
    return {name, message, given, ...(prompts[promptType] || promptType)};
}

/**
 * Registers a prompt type for the arguments.
 * @param promptType The name of the prompt type.
 * @param promptTypeSpec The object depicting a prompt (in the same
 * format that would be provided for enquirer's prompt() method).
 */
function registerPromptType(promptType, promptTypeSpec) {
    if (prompts[promptType] !== undefined) {
        throw new Error(`A prompt type is already registered with this name: ${promptType}`);
    }
    prompts[promptType] = promptTypeSpec;
}

/**
 * Prepares all the given arguments into enquirer's prompts.
 * Each element must be {name, message, promptType[, given]}.
 * @param arguments The list of argument entries.
 * @param nonInteractive Flag to tell whether the interaction must
 * not become interactive (by raising an error) or can be.
 * @returns {Array} The native prompts.
 */
function preparePrompts(arguments, nonInteractive) {
    return arguments.map(({name, message, promptType, given}) => preparePrompt(
        name, message, promptType, nonInteractive, given
    ));
}

module.exports = {
    preparePrompts, registerPromptType
}