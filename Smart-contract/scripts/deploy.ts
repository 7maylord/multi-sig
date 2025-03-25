import { Signer } from "ethers";

require("dotenv").config();
const { ethers, run, network } = require("hardhat");

const boardAddresses = [
  "0xb4934871aB71D978973f299b59D8Aa2B0C77DdbB",
  "0xbE3171d0e36a012319a5C76bCcD71250499b1C16",
  "0xb216270aFB9DfcD611AFAf785cEB38250863F2C9",
  "0x6D2Dd04bF065c8A6ee9CeC97588AbB0f967E0df9",
  "0xa956Be51d3a76E971048560Bd4eA2e365ddCf245",
  "0x2CBBb94777d7Cdcf718BF4533BFfF3cD8a94f447",
  "0x05C8BFBFb2cc4Ed506dDC0C5C15BD3437a0be31c",
  "0x9700f414bdcB4Dd211716D424D61490b42eD0883",
  "0x372b4eB67006F68A9f296b23715055b8A878ABA9",
  "0xC929588866c2bdCf6D70C47c86979009cBb6CE37",
  "0xb216270aFB9DfcD611AFAf785cEB38250863F2C9",
  "0x96d68F187ACCE7bCBE401D7111c4852a62b072E6",
  "0xAf50C37C8B4534670cfE2099ff205c1a0Df88D3d",
  "0x0F4A3d0e66fD5967f789F177D237EC60148eB369",
  "0x2d90C8bE0Df1BA58a66282bc4Ed03b330eBD7911",
  "0x4781070885eA1E2Ec9aE46201703172c576cDA1A",
  "0x0987654321098765432109876543210987654321",
  "0xA1eE1Abf8B538711c7Aa6E2B37eEf1A48021F2bB",
  "0xf04990915C006A35092493094B4367F6d93f9ff0",
  "0x690C65EB2e2dd321ACe41a9865Aea3fAa98be2A5",
];

async function main() {
  const signers = await ethers.getSigners();

  console.log("Total Signers Loaded:", signers.length);

  // Ensure exactly 20 board members
  // if (signers.length < 20) {
  //   throw new Error("Not enough board members. Need at least 20.");
  // }

  const deployer = signers[0];
  const recipient = signers[1];

  const boardMembers = boardAddresses.slice(0, 20);

  console.log(`Deploying contract with account: ${deployer.address}`);

  // Deploy the contract with 20 board members
  const CompanyMultiSig = await ethers.getContractFactory("CompanyMultiSig");
  //   const multiSig = await CompanyMultiSig.deploy(await Promise.all(boardMembers.map(async (member: Signer) => await member.getAddress())));

  const multiSig = await CompanyMultiSig.deploy(boardMembers);

  await multiSig.waitForDeployment();

  console.log(`CompanyMultiSig deployed at: ${multiSig.target}`);

  // Verify the contract after deployment
  if (process.env.HARDHAT_NETWORK !== "hardhat") {
    console.log(`Verifying contract on ${network.name} ...`);

    try {
      await run("verify:verify", {
        address: multiSig.target,
        constructorArguments: [boardMembers],
      });
      console.log(`Contract verified successfully on ${network.name}!`);
    } catch (error) {
      console.error(" Verification failed:", error);
    }
  }

//   // Fund the contract with 5 ETH
//   console.log("Funding contract with 5 ETH...");
//   const tx = await deployer.sendTransaction({
//     to: multiSig.target,
//     value: ethers.parseEther("5"),
//   });
//   await tx.wait();
//   console.log("Contract funded!:", tx.hash);

//   // Propose a budget
//   console.log("Proposing a budget of 3 ETH...");
//   const budgetTx = await multiSig
//     .connect(boardMembers[0])
//     .proposeBudget(recipient.address, ethers.parseEther("3"));
//   await budgetTx.wait();

//   console.log("Budget proposed!", budgetTx.hash);

//   // Check if funds were released
//   const contractBalanceBf = await ethers.provider.getBalance(multiSig.target);
//   const budgetStatusBf = await multiSig.getBudgetStatus(0);
//   console.log(`Budget amount: ${ethers.formatEther(budgetStatusBf[1])} ETH`);
//   console.log(
//     `Contract Balance Before: ${ethers.formatEther(contractBalanceBf)} ETH`
//   );
//   console.log(`Approval count: ${budgetStatusBf[2]}`);
//   console.log(`Timestamp: ${budgetStatusBf[3]}`);

//   // Approve budget from all 20 board members
//   console.log("Approving budget...");
//   for (let i = 0; i < 20; i++) {
//     const approveTx = await multiSig.connect(boardMembers[i]).approveBudget(0);
//     await approveTx.wait();
//     console.log(`Board member ${i + 1} approved. Tx hash: ${approveTx.hash}`);
//   }
//   console.log("Budget approved by all board members!");

//   // Check if funds were released
//   console.log("Checking if the Budget was Released!");
//   const contractBalanceAf = await ethers.provider.getBalance(multiSig.target);
//   const budgetStatusAf = await multiSig.getBudgetStatus(0);
//   console.log(`Budget amount: ${ethers.formatEther(budgetStatusAf[1])} ETH`);
//   console.log(
//     `Contract Balance After: ${ethers.formatEther(contractBalanceAf)} ETH`
//   );
//   console.log(`Approval count: ${budgetStatusAf[2]}`);
//   console.log(`Timestamp: ${budgetStatusAf[3]}`);

//   console.log("Deployment and interaction complete!");
 }

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
