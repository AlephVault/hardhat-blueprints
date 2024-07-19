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

    hre.enquirerPlus.utils.registerPromptClass("plus:hardhat:given-or-valid-hashed-input", HashedInput);
}

module.exports = {registerHashedInput};