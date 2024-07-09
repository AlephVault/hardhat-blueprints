# hardhat-blueprints
A hardhat plugin offering the possibility to generate new contract files (.sol) out of an extensible list of contract blueprints.

# Installation
Run this command to install it from NPM:

```shell
npm install hardhat-blueprints@^1.0.0
```

# Usage
This is a hardhat plugin, so the first thing to do is to install it in your hardhat.config.ts file:

```javascript
require("hardhat-blueprints");
```

Once there, you can make use of it (this supports both viem-enabled and ethers-enabled projects):

## Listing the available blueprints

Write this command just to start:

```shell
npx hardhat blueprint list
```

At first (if you did not register any new blueprint nor installed other packages that do it) you
will see this content:

```
These are the available blueprints you can use in the `apply` command:
- contract: An empty contract
  - Arguments:
    - SOLIDITY_VERSION: The Solidity version for the new file (An X.Y.Z Solidity version in the project)
- interface: An empty interface
  - Arguments:
    - SOLIDITY_VERSION: The Solidity version for the new file (An X.Y.Z Solidity version in the project)
- library: An empty library
  - Arguments:
    - SOLIDITY_VERSION: The Solidity version for the new file (An X.Y.Z Solidity version in the project)
- existing-contract-deployment-module: An ignition module for an existing contract (by artifact ID and contract address)
  - Arguments:
    - CONTRACT_NAME: The type to use for the contract (The ID of an artifact)
    - CONTRACT_ADDRESS: The address where the contract is deployed (A checksum address)
- new-contract-deployment-module: An ignition module for a new contract (by artifact ID)
  - Arguments:
    - CONTRACT_NAME: The type to use for the contract (The ID of an artifact)
```

Which details many entries (there are 5 built-in entries by default), like "contract" or
"interface" and 3 more.

If you expect a blueprint to be available for use, either provided by your own code or a
different plugin, ensure that it is listed here (otherwise, it won't be available).

## Applying a blueprint

There are certain types of blueprints here to account for:

1. Source code blueprints. They typically come from .sol files and will end in your sources
   directory (e.g. your project's `contracts/` directory).
2. Ignition modules. This will be useful if your project uses `hardhat-ignition`. They are
   .js files and will end in your `ignition/modules/` directory.

But, independently of the type, applying a blueprint has always this workflow:

1. You tell which blueprint to use.
2. You tell the name of the result file (be it a module or a contract / interface / library).
3. You tell whatever arguments are required (and validated).

This can be done in two ways (which can be partially applied):

1. You add a positional argument with a valid blueprint key to use (e.g. "contract") or it
   will be prompted for you to manually fill.
2. You tell all the required arguments, one by one. For example, SOLIDITY_VERSION=0.8.24
   (the format is: like environment variables). These are positional arguments. If you don't
   specify one or more of the required arguments (and with a valid value for it), it/they'll
   be prompted for you to manually fill them.
   1. This includes the `SCRIPT_NAME` argument (e.g. SCRIPT_NAME=MySampleContract for the
      "contract" example).
3. The file will be immediately generated.

## About the parameters

The parameter system is based on `enquirer` but, in this case, it has an upper level of
abstraction (which is, for example, useful for describing the metadata in the `list` task).

So these are actually not prompts but instead _presets_ or _argument types_, which are still
built on top of prompts. The available argument types are strings:

- `typeName`: A PascalCase name, valid for contract/interface/library names.
- `identifier`: A camelCase name, valid for variable or function names.
- `contract`: A reference to a contract (from compiled artifacts only).
- `number`: A positive, base-10, number.
- `integer`: A positive, base-10 or 0x-prefixed base-16, number.
- `boolean`: A boolean value. You'll use `true` or `false` there.
- `address`: A checksum-valid address.
- `smart-address`: A checksum-valid address or an account index (works both in viem and ethers).
- `solidity` A solidity version, in format X.Y.Z. It must be one of the versions installed in
  your project.
- Alternatively, an object. The format of this object is the same as the entries used in the
  `prompt` method in the `enquirer` library (but also considering the available types from the
  `hardhat-enquirer-plus` package).

To create a _new_ argument type, not listed among these (and not wishing to use the custom
object as a one-off type), you can call:

```javascript
// Registering a new "bytes32-hex" type:
hre.blueprints.registerBlueprintArgumentType(
    "bytes32-hex", {
        type: "plus:given-or-valid-input",
        validate: /^0x[a-f0-9]{64}$/,
        makeInvalidInputMessage: (v) => `Invalid bytes32 string: ${v}`,
        onInvalidGiven: (v) => console.error(`Invalid given bytes32 string: ${v}`)
    }, "A 0x-prefixed byte-aligned binary string of 32 bytes"
);
```

It will work as expected when you try to define arguments of `"bytes32-hex"` type for
your new blueprints.

You'll only typically need this when developing your own plugin (on top of this one)
which needs to also define new types for some blueprints on its own.

## Registering a new blueprint

To create a _new_ blueprint, not listed among the default blueprints described here,
you can call:

```javascript
// Let's define two new argument types as well.
hre.blueprints.registerBlueprintArgumentType(
    "erc20-symbol", {
        type: "plus:given-or-valid-input",
        validate: /^[A-Z][A-Z]{2,}$/,
        makeInvalidInputMessage: (v) => `Invalid ERC20 symbol: ${v}`,
        onInvalidGiven: (v) => console.error(`Invalid given ERC20 symbol: ${v}`)
    }, "An uppercase (letter-starting) short ERC20 symbol name"
);
hre.blueprints.registerBlueprintArgumentType(
    "erc20-token-name", {
        type: "plus:given-or-valid-input",
        validate: /^[ A-Za-z0-9_-]+$/,
        makeInvalidInputMessage: (v) => `Invalid ERC20 token name: ${v}`,
        onInvalidGiven: (v) => console.error(`Invalid given ERC20 token name: ${v}`)
    }, "An ERC20 token title/name"
);

// Let's say it is an OpenZeppelin-based ERC20 contract.
const filePath = path.resolve(__dirname, "path", "to", "my", "ERC20.sol.template");
hre.blueprints.registerBlueprint(
    "erc-20", "MyERC20", "An OpenZeppelin-based ERC20 contract",
    filePath, "solidity", [{
        // You'll typically define this argument for .sol files.
        name: "SOLIDITY_VERSION",
        description: "The Solidity version for the new file",
        message: "Choose the solidity version for this file",
        argumentType: "solidity"
    }, {
        name: "SYMBOL",
        description: "The symbol for this token",
        message: "What's the symbol for your token?",
        argumentType: "erc20-symbol"
    }, {
        name: "TOKEN_NAME",
        description: "The name for this token",
        message: "Give a name/title to your token",
        argumentType: "erc20-token-name"
    }]
);
```

__PLEASE NOTE:__ You must not define the `SCRIPT_NAME` argument. It is already defined.

The `ERC20.sol.template` contents will look like this:

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity #SOLIDITY_VERSION#;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract #SCRIPT_NAME# is ERC20 {
    constructor() ERC20("#TOKEN_NAME#", "#SYMBOL#") {}
}
```

Notice how both `SCRIPT_NAME` and the oter 3 arguments are defined. They'll be properly
accounted for when trying the command:

```shell
npx hardhat blueprint apply erc20 ... # the arguments here
```
