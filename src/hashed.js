function registerHashedInput(hre) {
    /**
     * This input takes an arbitrary text from the user and hashes it.
     */
    class HashedInput extends hre.enquirerPlus.Enquirer.GivenOrValidInput {
        constructor(options) {
            super({...options, validate: (x) => true});
        }

        async result(v) {
            return hre.common.keccak256(v);
        }
    }

    /**
     * This input takes an input from the user which can be an arbitrary
     * string to hash or an already-hashed string.
     */
    class SmartHashedInput extends hre.enquirerPlus.Enquirer.Prompt {
        constructor({given, nonInteractive, ...options}) {
            super(options);
            this._given = given;
            this._nonInteractive = nonInteractive;
        }

        async _submitAndReturn(value) {
            this.value = value;
            await this.submit();
            return this.value;
        }

        async _preprocessGiven() {
            if (typeof this._given === "string") {
                // hash it directly.
                return await this._submitAndReturn(hre.common.keccak256(this._given));
            } else if (this._given) {
                // It'll be a complex object.
                let {hashed, value} = this._given;
                if (typeof hashed !== "boolean" || typeof value !== "string") {
                    // Let's discord it.
                    console.error("Invalid smart hash input. It must be string or {hashed: boolean, value: string}");
                    this._given = undefined;
                } else if (hashed) {
                    // This is a hashed value. Validate it.
                    if (/^0x[a-fA-F0-9]{64}$/.test(value)) {
                        return await this._submitAndReturn(value);
                    } else {
                        console.error("Invalid smart hash input. If .hashed, the value must be a 0x + 64-hex string");
                        this._given = undefined;
                    }
                } else {
                    // This is an arbitrary value. Hash and return it.
                    return await this._submitAndReturn(hre.common.keccak256(value));
                }
            } else {
                // Null, false or undefined.
                this._given = undefined;
            }

            // An invalid value on return will be used to tell
            // whether the flow must continue instead of just
            // returning.
            return "";
        }

        async run() {
            const preprocessed = await this._preprocessGiven();
            if (preprocessed) {
                return preprocessed;
            } else {
                // Start asking the kind of input.
                // The input type.
                const direct = (await new hre.enquirerPlus.Enquirer.GivenOrSelect({
                    message: "What do you want to input?",
                    nonInteractive: this._nonInteractive,
                    choices: [
                        {name: "indirect", message: "A free text that I want to be hashed"},
                        {name: "direct", message: "A direct 0x-prefixed value of 64 hex chars"}
                    ]
                }).run()) === "direct";

                // The actual content.
                let content;
                if (!direct) {
                    content = await new HashedInput({message: "Enter the string to hash"}).run();
                } else {
                    content = await new hre.enquirerPlus.Enquirer.GivenOrValidInput({
                        nonInteractive: this._nonInteractive, message: "Enter a valid hash",
                        validate: /^0x[a-fA-F0-9]{64}$/,
                        onInvalidGiven: (v) => console.error(`Invalid hash: ${v}`)
                    }).run();
                }
                return await this._submitAndReturn(content);
            }
        }

        async render() {}
    }

    hre.enquirerPlus.utils.registerPromptClass("plus:hardhat:given-or-valid-hashed-input", HashedInput);
    hre.enquirerPlus.utils.registerPromptClass("plus:hardhat:given-or-valid-smart-hashed-input", SmartHashedInput);
}

module.exports = {registerHashedInput};