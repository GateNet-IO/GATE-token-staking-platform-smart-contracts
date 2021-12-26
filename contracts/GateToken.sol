// SPDX-License-Identifier: MIT

pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract GateToken is ERC20Burnable {
    constructor() ERC20("GATE", "GATE") {
        _mint(msg.sender, 900_000_000 ether);
    }
}
