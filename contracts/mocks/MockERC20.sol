// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @notice Simple ERC20 token for testing
 */
contract MockERC20 is ERC20 {
    uint8 private _decimals;
    
    mapping(address => uint256) public lastMintTime;
    uint256 public constant COOLDOWN = 24 hours;
    uint256 public constant MAX_MINT_AMOUNT = 1000 * 10**18; // Max 1000 tokens per mint

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) {
        _decimals = decimals_;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external {
        // Limit mint amount
        require(amount <= MAX_MINT_AMOUNT, "MockERC20: Mint amount exceeds limit (1000)");

        // Bypass cooldown for initial mints or if it's the first time
        // But we want to enforce it.
        // Note: TokenFactory calls this immediately after creation.
        require(block.timestamp >= lastMintTime[msg.sender] + COOLDOWN, "MockERC20: Cooldown active (1 mint per 24h)");
        
        lastMintTime[msg.sender] = block.timestamp;
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}
