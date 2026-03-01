// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./mocks/MockERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenFactory
 * @notice Factory for creating standard ERC20 tokens for auctions
 */
contract TokenFactory is Ownable {
    // Event emitted when a new token is created
    event TokenCreated(address indexed tokenAddress, address indexed creator, string name, string symbol, uint256 initialSupply);

    // Array to track all created tokens
    address[] public createdTokens;

    // Mapping from creator to their tokens
    mapping(address => address[]) public tokensByCreator;

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Creates a new standard ERC20 token
     * @param name The name of the token
     * @param symbol The symbol of the token
     * @param initialSupply The initial supply to mint to the creator
     * @param decimals_ The number of decimals (usually 18)
     */
    function createToken(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint8 decimals_
    ) external returns (address) {
        // Deploy new token
        MockERC20 newToken = new MockERC20(name, symbol, decimals_);
        
        // Mint initial supply to the creator (msg.sender)
        newToken.mint(msg.sender, initialSupply);

        address tokenAddress = address(newToken);
        
        // Track the token
        createdTokens.push(tokenAddress);
        tokensByCreator[msg.sender].push(tokenAddress);

        emit TokenCreated(tokenAddress, msg.sender, name, symbol, initialSupply);

        return tokenAddress;
    }

    /**
     * @notice Returns the number of tokens created by a user
     */
    function getCreatorTokenCount(address creator) external view returns (uint256) {
        return tokensByCreator[creator].length;
    }

    /**
     * @notice Returns all tokens created by a user
     */
    function getCreatorTokens(address creator) external view returns (address[] memory) {
        return tokensByCreator[creator];
    }
}
