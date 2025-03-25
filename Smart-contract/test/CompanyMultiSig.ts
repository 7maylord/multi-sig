import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("CompanyMultiSig", () => {
  async function deployCompanyMultiSigFixture() {
    const signers = await ethers.getSigners();

    if (signers.length < 20) {
      throw new Error("Test requires at least 20 board members");
    }

    const owner = signers[0];
    const recipient = signers[1];
    const bM3 = signers[2];
    const bM4 = signers[3];
    const bM5 = signers[4];
    const bM6 = signers[5];

    const boardMembers = signers;


    // Deploy the CompanyMultiSig contract with 20 board members
    const CompanyMultiSig = await ethers.getContractFactory("CompanyMultiSig");
    const companyMultiSig = await CompanyMultiSig.deploy(boardMembers.slice(0, 20).map((b) => b.address));
    await companyMultiSig.waitForDeployment();

    // Fund the contract with initial deposit
    const initialDeposit = ethers.parseEther("100"); // 100 Ether initial deposit
    await owner.sendTransaction({
      to: companyMultiSig.target,
      value: initialDeposit,
    });

    return { companyMultiSig, owner, bM3, bM4, bM5, bM6, boardMembers, recipient };
  }

  describe("Deployment", () => {
    it("Should set the correct board members", async () => {
      const { companyMultiSig, boardMembers } = await loadFixture(deployCompanyMultiSigFixture);
      const members = await companyMultiSig.getBoardMembers();
      expect(members.length).to.equal(20);
      expect(members[0]).to.equal(boardMembers[0]);
    });
  });

  describe("Propose and Approve Budget", () => {
    it("Should allow a board member to propose a budget", async () => {
      const { companyMultiSig, owner, boardMembers, recipient } = await loadFixture(deployCompanyMultiSigFixture);
      const budgetAmount = ethers.parseEther("10"); // 10 Ether budget

      // Board member proposes a budget
      await companyMultiSig.connect(owner).proposeBudget(recipient.address, budgetAmount);

      // Check if the budget is proposed correctly
      const budgets = await companyMultiSig.getBudgets();
      expect(budgets.length).to.equal(1); 
      expect(budgets[0].recipient).to.equal(recipient.address);
      expect(budgets[0].amount.toString()).to.equal(budgetAmount.toString());
    });

    it("Should allow board members to approve a proposed budget", async () => {
      const { companyMultiSig, owner, recipient, boardMembers } = await loadFixture(deployCompanyMultiSigFixture);
      const budgetAmount = ethers.parseEther("10"); // 10 Ether budget
      await companyMultiSig.connect(owner).proposeBudget(owner.address, budgetAmount);
      const budgetId = 0;

      // First approval by a board member
      await companyMultiSig.connect(owner).approveBudget(budgetId);
      const budget = (await companyMultiSig.getBudgets())[budgetId];
      expect(budget.approvals).to.equal(1); // 1 approval

      // Second approval by another board member
      await companyMultiSig.connect(recipient).approveBudget(budgetId);
      const updatedBudget = (await companyMultiSig.getBudgets())[budgetId];
      expect(updatedBudget.approvals).to.equal(2); // 2 approvals
    });

    it("Should prevent a board member from approving the same budget twice", async () => {
      const { companyMultiSig, owner, bM3, boardMembers } = await loadFixture(deployCompanyMultiSigFixture);
      const budgetAmount = ethers.parseEther("10");
      await companyMultiSig.connect(owner).proposeBudget(owner.address, budgetAmount);
      const budgetId = 0;

      // First approval
      await companyMultiSig.connect(bM3).approveBudget(budgetId);

      // Try approving again
      await expect(companyMultiSig.connect(bM3).approveBudget(budgetId))
        .to.be.revertedWithCustomError(companyMultiSig, "AlreadyApproved");
    });
  });

  describe("Release Funds", () => {
    it("Should release funds once all board members approve", async () => {
      const { companyMultiSig, bM5, boardMembers, recipient } = await loadFixture(deployCompanyMultiSigFixture);
      const budgetAmount = ethers.parseEther("10");
      // Propose the budget
      await companyMultiSig.connect(bM5).proposeBudget(recipient.address, budgetAmount);
      const budgetId = 0;

     // Approve the budget by all board members
     for (let i = 0; i < 19; i++) {
      await companyMultiSig.connect(boardMembers[i]).approveBudget(budgetId);
    }

     await expect(companyMultiSig.connect(boardMembers[19]).approveBudget(budgetId)).to.emit(companyMultiSig, "BudgetReleased");
    });

    it("Should not release funds if not all board members approve", async () => {
      const { companyMultiSig, bM4, bM3, boardMembers, recipient } = await loadFixture(deployCompanyMultiSigFixture);
      const budgetAmount = ethers.parseEther("10");

      // Propose the budget
      await companyMultiSig.connect(bM4).proposeBudget(recipient.address, budgetAmount);
      const budgetId = 0;

      // Approve by only one board member
      await companyMultiSig.connect(bM3).approveBudget(budgetId);

      // Try to release funds before all approvals
      await expect(companyMultiSig.releaseBudget(budgetId)).to.be.revertedWithCustomError(companyMultiSig, "ApprovalPending");
    });

    it("Should revert if there are insufficient funds", async () => {
      const { companyMultiSig, owner, boardMembers, recipient } = await loadFixture(deployCompanyMultiSigFixture);
      const insufficientAmount = ethers.parseEther("1000"); // More than the balance

      // Propose a budget with insufficient funds
      await companyMultiSig.connect(owner).proposeBudget(recipient.address, insufficientAmount);
      const budgetId = 0;
      
      // Approve the budget by all board members
      for (let i = 0; i < 19; i++) {
        await companyMultiSig.connect(boardMembers[i]).approveBudget(budgetId);
      }

      // Expect the 20th approval to trigger an automatic failure due to insufficient funds
      await expect(companyMultiSig.connect(boardMembers[19]).approveBudget(budgetId)).to.be.revertedWithCustomError(companyMultiSig, "InsufficientFunds");

    });
  });
});
