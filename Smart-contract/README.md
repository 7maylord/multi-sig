# CompanyMultiSig - Multi-Signature Budget Approval Smart Contract

## Overview
CompanyMultiSig is a multi-signature smart contract designed to facilitate decentralized budget approvals and fund releases within a corporate board. It ensures that all budget allocations require unanimous approval from 20 board members before funds are released.

## Features
- **Multi-Signature Approval**: Requires approval from all 20 board members to release funds.
- **Budget Proposal**: Board members can propose budgets for specific recipients.
- **Fund Release**: Once approved by all members, funds are automatically transferred to the recipient.
- **Event Logging**: Tracks all deposits, approvals, and fund releases on the blockchain.
- **Security Measures**: Ensures only board members can propose and approve budgets.

## Smart Contract Details
- **Solidity Version**: 0.8.28
- **Events**:
  - `Deposit(address indexed sender, uint256 amount)`
  - `BudgetProposed(uint256 indexed budgetId, address indexed recipient, uint256 amount)`
  - `BudgetApproved(uint256 indexed budgetId, address indexed approver)`
  - `BudgetReleased(uint256 indexed budgetId, address indexed recipient, uint256 amount)`

## Prerequisites
- **Node.js** (v16+ recommended)
- **Hardhat**
- **Ethers.js**

## Setup Instructions

### 1. Clone the Repository
```sh
git clone https://github.com/7maylord/multi-sig
cd multisig
```

### 2. Install Dependencies
```sh
npm install
```

### 3. Configure Environment Variables
Create a `.env` file and add the following:
```env
PRIVATE_KEY=your_private_key
ALCHEMY_API_KEY=your_alchemy_api_key
```

### 4. Compile the Smart Contract
```sh
npx hardhat compile
```

### 5. Deploy and interact Locally (Hardhat Network)
```sh
npx hardhat node
npx hardhat run scripts/deploy.ts --network localhost
```

## Interaction with the Contract

### Check Contract Balance
```typescript
const contractBalance = await ethers.provider.getBalance(multiSig.target);
console.log(`Contract Balance: ${ethers.formatEther(contractBalance)} ETH`);
```

### Propose a Budget
```typescript
const budgetTx = await multiSig.connect(boardMembers[0]).proposeBudget(recipient.address, ethers.parseEther("3"));
await budgetTx.wait();
```

### Approve Budget from All Board Members
```typescript
for (let i = 0; i < 20; i++) {
  const approveTx = await multiSig.connect(boardMembers[i]).approveBudget(0);
  await approveTx.wait();
}
```

### Check Budget Status
```typescript
const budgetStatus = await multiSig.getBudgetStatus(0);
console.log(`Approval count: ${budgetStatus[2]}`);
```

## Testing
Run unit tests to verify contract functionality:
```sh
npx hardhat test
```

## License
This project is unlicensed.

## Author
Developed by **[MayLord](https://github.com/7maylord)**. Feel free to contribute and improve the project!

---

Happy coding! 🚀