import { Signer } from "ethers";

require("dotenv").config();
const { ethers, run, network } = require("hardhat");

async function main() {
  const signers = await ethers.getSigners();

  console.log("Total Signers Loaded:", signers.length);

  console.log("the length is", signers.length)
  // Ensure exactly 20 board members
  if (signers.length < 20) {
    throw new Error("Not enough board members. Need at least 20.");
  }

  const deployer = signers[0];
  const recipient = signers[1];

  const boardMembers = signers;

  console.log(`Deploying contract with account: ${deployer.address}`);

  // Deploy the contract with 20 board members
  const CompanyMultiSig = await ethers.getContractFactory("CompanyMultiSig");
//   const multiSig = await CompanyMultiSig.deploy(await Promise.all(boardMembers.map(async (member: Signer) => await member.getAddress())));

    const multiSig = await CompanyMultiSig.deploy(boardMembers.slice(0, 20).map((b: { address: any; }) => b.address));
  
  await multiSig.waitForDeployment();

  console.log(`CompanyMultiSig deployed at: ${multiSig.target}`);


    //   // Verify the contract on BaseScan (Base Sepolia) after deployment
    //   if (process.env.HARDHAT_NETWORK !== "hardhat") {
    //     console.log("Verifying contract on BaseScan (Base Sepolia)...");

    //     try {
    //         await run("verify:verify", {
    //             address: multiSig.target,
    //             constructorArguments: [boardMembers.map((member: any) => member.address)],
    //           });
    //         console.log("Contract verified successfully on BaseScan!");
    //     } catch (error) {
    //         console.error(" Verification failed:", error);
    //     }
    // }

  // Fund the contract with 5 ETH
  console.log("Funding contract with 5 ETH...");
  const tx = await deployer.sendTransaction({
    to: multiSig.target,
    value: ethers.parseEther("5"),
  });
  await tx.wait();
  console.log("Contract funded!:", tx.hash);

  // Propose a budget
  console.log("Proposing a budget of 3 ETH...");
  const budgetTx = await multiSig.connect(boardMembers[0]).proposeBudget(recipient.address, ethers.parseEther("3"));
  await budgetTx.wait();

  console.log("Budget proposed!", budgetTx.hash);

   // Check if funds were released
   const contractBalanceBf = await ethers.provider.getBalance(multiSig.target);
   const budgetStatusBf = await multiSig.getBudgetStatus(0);
   console.log(`Budget amount: ${ethers.formatEther(budgetStatusBf[1])} ETH`);
   console.log(`Contract Balance Before: ${ethers.formatEther(contractBalanceBf)} ETH`);
   console.log(`Approval count: ${budgetStatusBf[2]}`);
   console.log(`Timestamp: ${budgetStatusBf[3]}`);

  // Approve budget from all 20 board members
  console.log("Approving budget...");
  for (let i = 0; i < 20; i++) {
    const approveTx = await multiSig.connect(boardMembers[i]).approveBudget(0);
    await approveTx.wait();
    console.log(`Board member ${i + 1} approved. Tx hash: ${approveTx.hash}`);
  }
  console.log("Budget approved by all board members!");

  // Check if funds were released
  console.log("Checking if the Budget was Released!");
  const contractBalanceAf = await ethers.provider.getBalance(multiSig.target);
  const budgetStatusAf = await multiSig.getBudgetStatus(0);
  console.log(`Budget amount: ${ethers.formatEther(budgetStatusAf[1])} ETH`);
  console.log(`Contract Balance After: ${ethers.formatEther(contractBalanceAf)} ETH`);
  console.log(`Approval count: ${budgetStatusAf[2]}`);
  console.log(`Timestamp: ${budgetStatusAf[3]}`);

  console.log("Deployment and interaction complete!");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
