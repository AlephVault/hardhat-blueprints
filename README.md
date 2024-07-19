# hardhat-blueprints
A hardhat plugin offering the possibility to generate new contract files (.sol) out of an extensible list of contract blueprints.

# Installation
Run this command to install it from NPM:

```shell
npm install --save-dev hardhat-common-tools@^1.3.0 hardhat-enquirer-plus@^1.4.0 hardhat-blueprints@^1.2.2
```

# Usage
This is a hardhat plugin, so the first thing to do is to install it in your hardhat.config.ts file:

```javascript
require("hardhat-common-tools");
require("hardhat-enquirer-plus");
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
- `numeric-string`: A base-10 number. Returns a string.
- `integer-string`: A base-10, or 0x-prefixed base-16, number. Returns a string.
- `bigint`: A base-10, or 0x-prefixed base-16, number. Returns a bigint.
- `boolean`: A boolean value. You'll use `true` or `false` there.
- `account`: An account index (works both in viem and ethers).
- `address`: A checksum-valid address (works both in viem and ethers).
- `smart-address`: A checksum-valid address or an account index (works both in viem and ethers).
- `solidity` A solidity version, in format X.Y.Z. It must be one of the versions installed in
  your project.
- `token-amount`: A token amount with units, e.g.: "1.5ether", "2 ether", "1gwei", "0.5 gwei"
  or other standard units.
- `int8` to `int256`: A BigInt input of that size.
- `uint8` to `uint256`: A BigInt input of that size.
- `bytes1` to `bytes32`: An hexadecimal input of that (byte-wise) length.
- `string` and `bytes`: An arbitrary string or arbitrary byte-aligned hex string.
- Alternatively, an object. The format of this object is the same as the entries used in the
  `prompt` method in the `enquirer` library (but also considering the available types from the
  `hardhat-enquirer-plus` package).
- `hashed-text`: A text that will be hashed with keccak256. The result is hashed with keccak256,
  compatible with Solidity's `keccak256(abi.encodePacked(x))`.
- `hashed`: Either a text that will be hashed or an already-computed valid hash (as in `bytes32`
  format). The `given` value may be a string (which will be hashed), a compound object like
  `{hashed: false, value: string}` (whose `value` will be hashed) or a compound object like
  `{hashed: true, value: string}` (whose `value` must be a valid `bytes32` value and will not
  be hashed but returned as-is).

### Registering a new argument type

To create an AAA-9999 argument type, not listed among these (and not wishing to use the custom
object as a one-off type), you can call:

```javascript
// Registering a new "plate-code" type:
hre.blueprints.registerBlueprintArgumentType(
    "plate-code", {
        type: "plus:given-or-valid-input",
        validate: /^[A-Z]{3}-[0-9]{9}$/,
        makeInvalidInputMessage: (v) => `Invalid plate code: ${v}`,
        onInvalidGiven: (v) => console.error(`Invalid given plate code: ${v}`)
    }, "An AAA-9999 code (3 uppercase letters, 4 decimal digits)"
);
```

It will work as expected when you try to define arguments of `"plate-code"` type for
your new blueprints.

You'll only typically need this when developing your own plugin (on top of this one)
which needs to also define new types for some blueprints on its own.

### Manually applying / reading arguments

Considering the given types (and new ones) you could manually implement reading arguments
by invoking this method, for example:

```javascript
const prompts = hre.blueprints.prepareArgumentPrompts([
    {
        name: "fromAddress",
        description: "The source address",
        message: "Enter the source address",
        argumentType: "smart-address"
    },
    {
        name: "toAddress",
        description: "The destination address",
        message: "Enter the destination address",
        argumentType: "smart-address"
    },
    {
        name: "id",
        description: "The token id",
        message: "Enter the ID of the token",
        argumentType: "bigint"
    },
    {
        name: "value",
        description: "The token id",
        message: "Enter the ID of the token",
        argumentType: "bigint"
    },
    {
        name: "plate-code",
        description: "A plate code",
        message: "A plate code (it will be hashed and used as data)",
        argumentType: "plate-code"
    }
]);
console.log(await new hre.enquirerPlus.Enquirer().prompt(prompts));
```

In the end, the `result` will be a literal object with fields `id`, `value`, `data`, `fromAddress`, `toAddress`.

### Compound types: arrays and tuples

Using arrays and tuples is done through custom, non-registered, prompts. However,
this package offers some helpers to aid for that purpose. For example, to ask for
an array of addresses and then a tuple type of (uint8, int16), this would do the
full job:

```javascript
const prompts = hre.blueprints.prepareArgumentPrompts([
	hre.blueprints.arrayArgument({
		message: "Input an array of addresses",
		description: "An addresses array",
		name: "addresses",
		elements: {
			argumentType: "smart-address",
			message: "Element ${index}"
		} 
	}),
	hre.blueprints.tupleArgument({
		message: "Input a tuple",
		description: "A tuple",
		name: "compound",
		elements: [{
			name: "foo",
			argumentType: "uint8"
		}, {
			name: "bar",
			argumentType: "int16"
		}]
	}),
]);

await hre.enquirerPlus.Enquirer.prompt(prompts);
// It'd return something like: {
//     addresses: [
//         '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
//         '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
//     ],
//     compound: [ 255n, 32767n ]
// }
```

In order to provide some given values and force the non-interactive
mode, this would also work (considering that the non-interactive
mode is enabled for any type, not just tuples or arrays):

```javascript
const prompts = hre.blueprints.prepareArgumentPrompts([
	hre.blueprints.arrayArgument({
		message: "Input an array of addresses",
		description: "An addresses array",
		name: "addresses",
		elements: {
			argumentType: "smart-address",
			message: "Element ${index}"
		} 
	}),
	hre.blueprints.tupleArgument({
		message: "Input a tuple",
		description: "A tuple",
		name: "compound",
		elements: [{
			name: "foo",
			argumentType: "uint8"
		}, {
			name: "bar",
			argumentType: "int16"
		}]
	}),
], true, {"addresses": ["0", "1"], "compound": ["0xff", "0x7fff"]});
```

Where the third parameter is a given value matching both names.

Also, arrays of tuples are supported (and nesting more stuff would be done in an analogous way):

```javascript
const prompts = hre.blueprints.prepareArgumentPrompts([
	hre.blueprints.arrayArgument({
		message: "Input an array of addresses",
		description: "An addresses array",
		name: "compounds",
		elements: hre.blueprints.tupleArgument({
			message: "Input the ${index}",
			description: "A tuple",
			name: "compound",
			elements: [{
				name: "foo",
				argumentType: "uint8"
			}, {
				name: "bar",
				argumentType: "int16"
			}]
		})
	}),
]);

await hre.enquirerPlus.Enquirer.prompt(prompts);
```

Which also supports given values and non-interactive mode:

```javascript
const prompts = hre.blueprints.prepareArgumentPrompts([
	hre.blueprints.arrayArgument({
		message: "Input an array of addresses",
		description: "An addresses array",
		name: "compounds",
		elements: hre.blueprints.tupleArgument({
			message: "Input the ${index}",
			description: "A tuple",
			name: "compound",
			elements: [{
				name: "foo",
				argumentType: "uint8"
			}, {
				name: "bar",
				argumentType: "int16"
			}]
		})
	}),
], true, {"compounds": [["0xff", "0x7fff"], ["0xff", "0x7fff"]]});

await hre.enquirerPlus.Enquirer.prompt(prompts);

```

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

## Manually executing / applying a blueprint
You have two options here:

1. Invoke the `apply` scoped task (running children tasks is documented in hardhat's
   official docs), properly specifying the arguments.
2. Invoke `hre.blueprints.applyBlueprint`. For example, to apply the `contract` blueprint:

   ```shell
   # 1. nonInteractive is being set to false, thus allowing prompts
   #    if something were to be invalid. Pass it as true in your
   #    calls if you want to ensure that no interactions must occur
   #    via prompting (raising an error instead).
   # 2. Provided 0.8.24 is a valid solidity version in your project.
   #    As SCRIPT_NAME is given, also any other expected argument
   #    can also be given.
   await hre.blueprints.applyBlueprint("contract", false, {"SCRIPT_NAME": "MyContract", "SOLIDITY_VERSION": "0.8.24"});
   ```

## New enquirer-plus types.
There are two extra enquirer-plus types registered here:

- Registered as "plus:hardhat:given-or-valid-hashed-input" and used in the "hashed-text" argument type,
  its class is `hre.enquirerPlus.Enquirer.HashedInput` and takes extra options: `given` (a string) and
  `nonInteractive`.
- Registered as "plus:hardhat:given-or-valid-smart-hashed-input" and used in the "hashed" argument type,
  its class is `hre.enquirerPlus.Enquirer.SmartHashedInput` and takes extra options: `given` (a string,
  a `{hashed: false, value: string}` or a `{hashed: true, value: string}`) and `nonInteractive`.

They can be safely used in calls to `hre.enquirerPlus.Enquirer.prompt`.