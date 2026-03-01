import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log(`
╔═══════════════════════════════════════════════════════════╗
║          ClearFall Protocol - Production Deployment        ║
╚═══════════════════════════════════════════════════════════╝
    `);

    console.log("Deployer:", deployer.address);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "MATIC");
    console.log("");

    // 1. Deploy MockERC20 (for testing only)
    console.log("Step 1/4: Deploying MockERC20 (test token)...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20.deploy("ClearFall Test Token", "CFT", 18);
    await mockToken.waitForDeployment();
    const mockTokenAddress = await mockToken.getAddress();
    console.log("MockERC20:", mockTokenAddress);
    console.log("");

    // 2. Deploy AuctionFactory
    console.log("Step 2/4: Deploying AuctionFactory...");
    const AuctionFactory = await ethers.getContractFactory("AuctionFactory");
    const factory = await AuctionFactory.deploy();
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log("AuctionFactory:", factoryAddress);
    console.log("");

    // 3. Deploy TokenFactory
    console.log("Step 3/4: Deploying TokenFactory...");
    const TokenFactory = await ethers.getContractFactory("TokenFactory");
    const tokenFactory = await TokenFactory.deploy();
    await tokenFactory.waitForDeployment();
    const tokenFactoryAddress = await tokenFactory.getAddress();
    console.log("TokenFactory:", tokenFactoryAddress);
    console.log("");

    // 4. Mint some test tokens to deployer
    console.log("Step 4/4: Minting test tokens...");
    const mintAmount = ethers.parseEther("1000"); // 1000 tokens (max limit)
    await mockToken.mint(deployer.address, mintAmount);
    console.log("Minted 1,000 CFT to deployer");
    console.log("");

    // Summary
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                  DEPLOYMENT COMPLETE                       ║
╠═══════════════════════════════════════════════════════════╣
║ Contract Addresses:                                        ║
╠═══════════════════════════════════════════════════════════╣
║ MockERC20:        ${mockTokenAddress}  ║
║ AuctionFactory:   ${factoryAddress}  ║
║ TokenFactory:     ${tokenFactoryAddress}  ║
╚═══════════════════════════════════════════════════════════╝

Next Steps:
───────────────────────────────────────────────────────────────
1. Copy this to your .env file:
   FACTORY_ADDRESS=${factoryAddress}
   TOKEN_FACTORY_ADDRESS=${tokenFactoryAddress}

2. Copy this to frontend/.env.local:
   NEXT_PUBLIC_FACTORY_ADDRESS=${factoryAddress}
   NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS=${tokenFactoryAddress}
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

3. Verify contracts on PolygonScan:
   npx hardhat verify --network amoy ${mockTokenAddress} "ClearFall Test Token" "CFT" 18
   npx hardhat verify --network amoy ${factoryAddress}
   npx hardhat verify --network amoy ${tokenFactoryAddress}

4. Deploy frontend to Vercel:
   cd frontend && vercel
───────────────────────────────────────────────────────────────
    `);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
