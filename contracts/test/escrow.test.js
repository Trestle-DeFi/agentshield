const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('AgentShieldDemoEscrow', () => {
  let escrow, usdc, payer, payee, other;
  const AMOUNT = 1_000_000n; // 1 USDC

  beforeEach(async () => {
    [payer, payee, other] = await ethers.getSigners();
    usdc = await ethers.deployContract('MockUSDC');
    escrow = await ethers.deployContract('AgentShieldDemoEscrow', [usdc.getAddress()]);
    await usdc.mint(payer.address, AMOUNT);
    await usdc.connect(payer).approve(escrow.getAddress(), AMOUNT);
  });

  it('creates escrow by pulling USDC', async () => {
    await expect(escrow.connect(payer).create(payee.address, AMOUNT))
      .to.emit(escrow, 'EscrowCreated')
      .withArgs(1, payer.address, payee.address, AMOUNT);
    expect(await usdc.balanceOf(escrow.getAddress())).to.equal(AMOUNT);
    expect(await usdc.balanceOf(payer.address)).to.equal(0);
  });

  it('releases to payee', async () => {
    await escrow.connect(payer).create(payee.address, AMOUNT);
    await expect(escrow.connect(payer).release(1))
      .to.emit(escrow, 'EscrowReleased')
      .withArgs(1, payee.address, AMOUNT);
    expect(await usdc.balanceOf(payee.address)).to.equal(AMOUNT);
    expect(await usdc.balanceOf(escrow.getAddress())).to.equal(0);
  });

  it('refunds payer', async () => {
    await escrow.connect(payer).create(payee.address, AMOUNT);
    await escrow.connect(payer).refund(1);
    expect(await usdc.balanceOf(payer.address)).to.equal(AMOUNT);
  });

  it('rejects non-payer release', async () => {
    await escrow.connect(payer).create(payee.address, AMOUNT);
    await expect(escrow.connect(other).release(1)).to.be.revertedWithCustomError(
      escrow,
      'NotPayer'
    );
  });

  it('rejects double settle', async () => {
    await escrow.connect(payer).create(payee.address, AMOUNT);
    await escrow.connect(payer).release(1);
    await expect(escrow.connect(payer).release(1)).to.be.revertedWithCustomError(
      escrow,
      'AlreadySettled'
    );
    await expect(escrow.connect(payer).refund(1)).to.be.revertedWithCustomError(
      escrow,
      'AlreadySettled'
    );
  });

  it('rejects zero payee/amount', async () => {
    await expect(
      escrow.connect(payer).create(ethers.ZeroAddress, AMOUNT)
    ).to.be.revertedWithCustomError(escrow, 'ZeroAddress');
    await expect(
      escrow.connect(payer).create(payee.address, 0)
    ).to.be.revertedWithCustomError(escrow, 'ZeroAmount');
  });
});
