// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title AgentShieldDemoEscrow — M2 demo artifact
/// @notice Minimal conditional escrow: payer deposits USDC, releases to payee
///         or refunds self. NOT the final AgentShieldEscrow (Phase C, <=7 fn).
contract AgentShieldDemoEscrow {
    IERC20 public immutable usdc;

    struct Escrow {
        address payer;
        address payee;
        uint256 amount;
        bool released;
        bool refunded;
    }

    mapping(uint256 => Escrow) public escrows;
    uint256 public nextId = 1;

    event EscrowCreated(uint256 indexed id, address indexed payer, address indexed payee, uint256 amount);
    event EscrowReleased(uint256 indexed id, address indexed payee, uint256 amount);
    event EscrowRefunded(uint256 indexed id, address indexed payer, uint256 amount);

    error ZeroAddress();
    error ZeroAmount();
    error NotPayer();
    error AlreadySettled();

    constructor(address usdc_) {
        if (usdc_ == address(0)) revert ZeroAddress();
        usdc = IERC20(usdc_);
    }

    function create(address payee, uint256 amount) external returns (uint256 id) {
        if (payee == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        usdc.transferFrom(msg.sender, address(this), amount);
        id = nextId++;
        escrows[id] = Escrow(msg.sender, payee, amount, false, false);
        emit EscrowCreated(id, msg.sender, payee, amount);
    }

    function release(uint256 id) external {
        Escrow storage e = escrows[id];
        if (msg.sender != e.payer) revert NotPayer();
        if (e.released || e.refunded) revert AlreadySettled();
        e.released = true;
        usdc.transfer(e.payee, e.amount);
        emit EscrowReleased(id, e.payee, e.amount);
    }

    function refund(uint256 id) external {
        Escrow storage e = escrows[id];
        if (msg.sender != e.payer) revert NotPayer();
        if (e.released || e.refunded) revert AlreadySettled();
        e.refunded = true;
        usdc.transfer(e.payer, e.amount);
        emit EscrowRefunded(id, e.payer, e.amount);
    }
}
