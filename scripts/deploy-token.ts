import { ethers } from "hardhat";

/**
 * Simple script to deploy a MockERC20 token for testing
 * Usage: npx hardhat run scripts/deploy-token.ts --network amoy
 */
async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("🚀 Deploying ERC20 Token...");
    console.log("📍 Deployer address:", deployer.address);
    console.log("💰 Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MATIC");
    console.log("");

    // Get token parameters (you can modify these)
    const tokenName = process.env.TOKEN_NAME || "My Auction Token";
    const tokenSymbol = process.env.TOKEN_SYMBOL || "MAT";
    const tokenDecimals = 18;
    const mintAmount = process.env.MINT_AMOUNT || "1000000"; // 1M tokens

    console.log("📋 Token Parameters:");
    console.log("   Name:", tokenName);
    console.log("   Symbol:", tokenSymbol);
    console.log("   Decimals:", tokenDecimals);
    console.log("   Initial Mint:", mintAmount, "tokens");
    console.log("");

    // Deploy MockERC20
    console.log("📦 Deploying MockERC20...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(
        tokenName,
        tokenSymbol,
        tokenDecimals
    );

    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    
    console.log("✅ Token deployed to:", tokenAddress);
    console.log("");

    // Mint tokens to deployer
    console.log("🪙 Minting tokens...");
    const mintAmountWei = ethers.parseEther(mintAmount);
    const mintTx = await token.mint(deployer.address, mintAmountWei);
    await mintTx.wait();
    
    const balance = await token.balanceOf(deployer.address);
    console.log("✅ Minted", ethers.formatEther(mintAmountWei), "tokens");
    console.log("💰 Your balance:", ethers.formatEther(balance), tokenSymbol);
    console.log("");

    // Display token info
    console.log("============================================");
    console.log("🎉 Token Deployment Complete!");
    console.log("============================================");
    console.log("");
    console.log("📋 Token Information:");
    console.log("   Address:", tokenAddress);
    console.log("   Name:", await token.name());
    console.log("   Symbol:", await token.symbol());
    console.log("   Decimals:", await token.decimals());
    console.log("   Total Supply:", ethers.formatEther(await token.totalSupply()), tokenSymbol);
    console.log("");
    console.log("🔧 Next Steps:");
    console.log("   1. Copy this token address:", tokenAddress);
    console.log("   2. Use it in the auction creation form");
    console.log("   3. Make sure you have enough tokens for your auction");
    console.log("");
    console.log("💡 View on PolygonScan:");
    console.log("   https://amoy.polygonscan.com/address/" + tokenAddress);
    console.log("");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
