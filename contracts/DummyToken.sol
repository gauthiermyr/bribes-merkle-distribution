// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DummyToken is ERC20 {

    constructor(string memory name, string memory symbol,uint256 initialSupply)  ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }

}