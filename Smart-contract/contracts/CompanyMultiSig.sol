// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract CompanyMultiSig {
    
    // State variables
    address[] public boardMembers;
    mapping(address => bool) public isBoardMember;
    mapping(uint256 => mapping(address => bool)) public approvals;
    Budget[] public budgets;

    struct Budget {
        address payable recipient;
        uint256 amount;
        bool released;
        uint256 approvals;
        uint256 timestamp; 
    }
  
    // Events
    event Deposit(address indexed sender, uint256 amount);
    event BudgetProposed(uint256 indexed budgetId, address indexed recipient, uint256 amount);
    event BudgetApproved(uint256 indexed budgetId, address indexed approver);
    event BudgetReleased(uint256 indexed budgetId, address indexed recipient, uint256 amount);

    modifier onlyBoardMember() {
        if (!isBoardMember[msg.sender]) revert NotBoardMember();
        _;
    }

    // Errors
    error NotBoardMember(); 
    error AlreadyApproved(); 
    error InvalidBudgetId();
    error BudgetAlreadyReleased();
    error InsufficientFunds();
    error ApprovalPending();

    constructor(address[] memory _boardMembers) {
        require(_boardMembers.length == 20, "Must have exactly 20 board members");
        for (uint256 i = 0; i < _boardMembers.length; i++) {
            boardMembers.push(_boardMembers[i]);
            isBoardMember[_boardMembers[i]] = true;
        }
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function proposeBudget(address payable _recipient, uint256 _amount) external onlyBoardMember {
        budgets.push(Budget({
            recipient: _recipient,
            amount: _amount,
            released: false,
            approvals: 0,
            timestamp: block.timestamp 
        }));
        emit BudgetProposed(budgets.length - 1, _recipient, _amount);
    }

    function approveBudget(uint256 _budgetId) external onlyBoardMember {
        if (_budgetId >= budgets.length) revert InvalidBudgetId();

        Budget storage budget = budgets[_budgetId];

        if (budget.released) revert BudgetAlreadyReleased();
        if (approvals[_budgetId][msg.sender]) revert AlreadyApproved();

        approvals[_budgetId][msg.sender] = true;
        budget.approvals++;

        emit BudgetApproved(_budgetId, msg.sender);

        if (budget.approvals == boardMembers.length) {
            releaseBudget(_budgetId);
        }
    }

    // Release Funds in a Budget  
    function releaseBudget(uint256 _budgetId) internal onlyBoardMember {
        Budget storage budget = budgets[_budgetId];

        if (budget.approvals < boardMembers.length) revert ApprovalPending();
        if (budget.released) revert BudgetAlreadyReleased();
        if (address(this).balance < budget.amount) revert InsufficientFunds();

        budget.released = true;
        budget.recipient.transfer(budget.amount);

        emit BudgetReleased(_budgetId, budget.recipient, budget.amount);
    }

    // Fetch status of a Budget
    function getBudgetStatus(uint256 _budgetId) external view returns (address recipient, uint256 amount, uint256 approvalCount, uint256 timestamp) {
        require(_budgetId < budgets.length, "Invalid Budget ID");
        Budget storage budget = budgets[_budgetId];
        return (budget.recipient, budget.amount, budget.approvals, budget.timestamp);
    }

    function getBoardMembers() external view returns (address[] memory) {
        return boardMembers;
    }

    function getBudgets() external view returns (Budget[] memory) {
        return budgets;
    }
}
