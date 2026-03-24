import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import type { SmartAccount, SmartAccountFactory } from "../typechain-types";

const ONE_ETH = ethers.parseEther("1");
const TWO_DAYS = 2 * 24 * 60 * 60;
const ONE_DAY = 24 * 60 * 60;

// ─── Fixtures ────────────────────────────────────────────────────────────────

async function deployFactoryFixture() {
  const [deployer, owner, alice, bob, carol, buyer1, buyer2] = await ethers.getSigners();

  const SmartAccountImpl = await ethers.getContractFactory("SmartAccount");
  const impl = await SmartAccountImpl.deploy();
  await impl.waitForDeployment();

  const SmartAccountFactoryF = await ethers.getContractFactory("SmartAccountFactory");
  const factory = (await SmartAccountFactoryF.deploy(
    await impl.getAddress(),
    deployer.address
  )) as SmartAccountFactory;
  await factory.waitForDeployment();

  return { impl, factory, deployer, owner, alice, bob, carol, buyer1, buyer2 };
}

async function deployFixedListFixture() {
  const base = await deployFactoryFixture();
  const { factory, owner, alice, bob, deployer } = base;

  const stakeholders = [
    { recipient: alice.address, shareBps: 6000 },
    { recipient: bob.address, shareBps: 4000 },
  ];

  const tx = await factory.connect(owner).createAccount(
    deployer.address,   // payoutAddress
    ONE_ETH,            // threshold = 1 ETH
    5000,               // sellerOverflowBps = 50%
    ONE_DAY,            // periodDuration
    ethers.ZeroAddress, // ETH
    0,                  // BeneficiaryMode.FIXED_LIST
    stakeholders,
    "Test Account"
  );
  const receipt = await tx.wait();
  const accountAddress = await getAccountFromReceipt(factory, receipt);
  const account = (await ethers.getContractAt("SmartAccount", accountAddress)) as SmartAccount;

  return { ...base, account, accountAddress };
}

async function deployBuyersFixture() {
  const base = await deployFactoryFixture();
  const { factory, owner, deployer } = base;

  const tx = await factory.connect(owner).createAccount(
    deployer.address,   // payoutAddress
    ONE_ETH,            // threshold = 1 ETH
    5000,               // sellerOverflowBps = 50%
    ONE_DAY,            // periodDuration
    ethers.ZeroAddress, // ETH
    1,                  // BeneficiaryMode.BUYERS
    [],                 // no stakeholders
    "Buyers Account"
  );
  const receipt = await tx.wait();
  const accountAddress = await getAccountFromReceipt(factory, receipt);
  const account = (await ethers.getContractAt("SmartAccount", accountAddress)) as SmartAccount;

  return { ...base, account, accountAddress };
}

async function getAccountFromReceipt(factory: SmartAccountFactory, receipt: any): Promise<string> {
  const event = receipt?.logs.find((l: any) => {
    try {
      return factory.interface.parseLog(l)?.name === "AccountCreated";
    } catch {
      return false;
    }
  });
  const parsed = factory.interface.parseLog(event as any);
  return parsed!.args.account as string;
}

async function getETHBalance(addr: string): Promise<bigint> {
  return ethers.provider.getBalance(addr);
}

// ─── Factory Tests ────────────────────────────────────────────────────────────

describe("SmartAccountFactory", () => {
  it("stores implementation address", async () => {
    const { impl, factory } = await loadFixture(deployFactoryFixture);
    expect(await factory.implementation()).to.equal(await impl.getAddress());
  });

  it("deploys clone and emits AccountCreated", async () => {
    const { factory, owner, alice, bob, deployer } = await loadFixture(deployFactoryFixture);
    const stakeholders = [
      { recipient: alice.address, shareBps: 5000 },
      { recipient: bob.address, shareBps: 5000 },
    ];
    await expect(
      factory.connect(owner).createAccount(
        deployer.address, ONE_ETH, 5000, ONE_DAY, ethers.ZeroAddress, 0, stakeholders, "Test"
      )
    ).to.emit(factory, "AccountCreated");
  });

  it("tracks accounts per owner", async () => {
    const { factory, owner, alice, bob, deployer } = await loadFixture(deployFactoryFixture);
    const stakeholders = [
      { recipient: alice.address, shareBps: 5000 },
      { recipient: bob.address, shareBps: 5000 },
    ];
    await factory.connect(owner).createAccount(
      deployer.address, ONE_ETH, 5000, ONE_DAY, ethers.ZeroAddress, 0, stakeholders, "Test"
    );
    await factory.connect(owner).createAccount(
      deployer.address, ONE_ETH, 5000, ONE_DAY, ethers.ZeroAddress, 0, stakeholders, "Test2"
    );
    expect(await factory.getAccountCountByOwner(owner.address)).to.equal(2);
  });

  it("increments total count", async () => {
    const { factory, owner, alice, bob, deployer } = await loadFixture(deployFactoryFixture);
    const stakeholders = [
      { recipient: alice.address, shareBps: 5000 },
      { recipient: bob.address, shareBps: 5000 },
    ];
    await factory.connect(owner).createAccount(
      deployer.address, ONE_ETH, 5000, ONE_DAY, ethers.ZeroAddress, 0, stakeholders, "Test"
    );
    expect(await factory.getTotalAccounts()).to.equal(1);
  });

  it("reverts when creation paused", async () => {
    const { factory, deployer, owner, alice, bob } = await loadFixture(deployFactoryFixture);
    await factory.connect(deployer).setCreationPaused(true);
    const stakeholders = [
      { recipient: alice.address, shareBps: 5000 },
      { recipient: bob.address, shareBps: 5000 },
    ];
    await expect(
      factory.connect(owner).createAccount(
        deployer.address, ONE_ETH, 5000, ONE_DAY, ethers.ZeroAddress, 0, stakeholders, "Test"
      )
    ).to.be.revertedWithCustomError(factory, "CreationIsPaused");
  });

  it("reverts if shares don't sum to 10000", async () => {
    const { impl, factory, owner, alice, bob, deployer } = await loadFixture(deployFactoryFixture);
    const bad = [
      { recipient: alice.address, shareBps: 5000 },
      { recipient: bob.address, shareBps: 3000 },
    ];
    // The error is defined in SmartAccount, not the factory — use the impl to specify it
    const implContract = await ethers.getContractAt("SmartAccount", await impl.getAddress());
    await expect(
      factory.connect(owner).createAccount(
        deployer.address, ONE_ETH, 5000, ONE_DAY, ethers.ZeroAddress, 0, bad, "Test"
      )
    ).to.be.revertedWithCustomError(implContract, "SharesDoNotSumTo100");
  });

  it("reverts if threshold zero", async () => {
    const { impl, factory, owner, alice, bob, deployer } = await loadFixture(deployFactoryFixture);
    const stakeholders = [
      { recipient: alice.address, shareBps: 5000 },
      { recipient: bob.address, shareBps: 5000 },
    ];
    const implContract = await ethers.getContractAt("SmartAccount", await impl.getAddress());
    await expect(
      factory.connect(owner).createAccount(
        deployer.address, 0, 5000, ONE_DAY, ethers.ZeroAddress, 0, stakeholders, "Test"
      )
    ).to.be.revertedWithCustomError(implContract, "InvalidThreshold");
  });

  it("reverts if period below minimum", async () => {
    const { impl, factory, owner, alice, bob, deployer } = await loadFixture(deployFactoryFixture);
    const stakeholders = [
      { recipient: alice.address, shareBps: 5000 },
      { recipient: bob.address, shareBps: 5000 },
    ];
    const implContract = await ethers.getContractAt("SmartAccount", await impl.getAddress());
    await expect(
      factory.connect(owner).createAccount(
        deployer.address, ONE_ETH, 5000, 3600, ethers.ZeroAddress, 0, stakeholders, "Test"
      )
    ).to.be.revertedWithCustomError(implContract, "InvalidPeriod");
  });

  it("reverts if duplicate stakeholder addresses", async () => {
    const { impl, factory, owner, alice, deployer } = await loadFixture(deployFactoryFixture);
    const dup = [
      { recipient: alice.address, shareBps: 5000 },
      { recipient: alice.address, shareBps: 5000 },
    ];
    const implContract = await ethers.getContractAt("SmartAccount", await impl.getAddress());
    await expect(
      factory.connect(owner).createAccount(
        deployer.address, ONE_ETH, 5000, ONE_DAY, ethers.ZeroAddress, 0, dup, "Test"
      )
    ).to.be.revertedWithCustomError(implContract, "DuplicateStakeholder");
  });
});

// ─── Initialization Tests ─────────────────────────────────────────────────────

describe("SmartAccount - Initialization", () => {
  it("sets all params correctly", async () => {
    const { account, owner, deployer } = await loadFixture(deployFixedListFixture);
    expect(await account.threshold()).to.equal(ONE_ETH);
    expect(await account.sellerOverflowBps()).to.equal(5000);
    expect(await account.periodDuration()).to.equal(ONE_DAY);
    expect(await account.token()).to.equal(ethers.ZeroAddress);
    expect(await account.owner()).to.equal(owner.address);
    expect(await account.payoutAddress()).to.equal(deployer.address);
  });

  it("sets stakeholders correctly", async () => {
    const { account, alice, bob } = await loadFixture(deployFixedListFixture);
    const stakeholders = await account.getStakeholders();
    expect(stakeholders.length).to.equal(2);
    expect(stakeholders[0].recipient).to.equal(alice.address);
    expect(stakeholders[0].shareBps).to.equal(6000);
    expect(stakeholders[1].recipient).to.equal(bob.address);
    expect(stakeholders[1].shareBps).to.equal(4000);
  });

  it("beneficiaryMode set correctly", async () => {
    const { account } = await loadFixture(deployFixedListFixture);
    // BeneficiaryMode.FIXED_LIST = 0
    expect(await account.beneficiaryMode()).to.equal(0);
  });

  it("payoutAddress set correctly", async () => {
    const { account, deployer } = await loadFixture(deployFixedListFixture);
    expect(await account.payoutAddress()).to.equal(deployer.address);
  });

  it("cannot be re-initialized", async () => {
    const { account, owner, deployer, alice, bob } = await loadFixture(deployFixedListFixture);
    const stakeholders = [
      { recipient: alice.address, shareBps: 5000 },
      { recipient: bob.address, shareBps: 5000 },
    ];
    await expect(
      account.initialize(
        owner.address, deployer.address, ONE_ETH, 5000, ONE_DAY,
        ethers.ZeroAddress, 0, stakeholders, "Re-init"
      )
    ).to.be.reverted;
  });
});

// ─── Payment: Below Threshold ─────────────────────────────────────────────────

describe("SmartAccount - Payment: below threshold", () => {
  it("full amount forwarded to payoutAddress", async () => {
    const { account, deployer, carol } = await loadFixture(deployFixedListFixture);
    const payoutBefore = await getETHBalance(deployer.address);
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("0.5") });
    const payoutAfter = await getETHBalance(deployer.address);
    expect(payoutAfter - payoutBefore).to.equal(ethers.parseEther("0.5"));
  });

  it("periodIncome updated", async () => {
    const { account, carol } = await loadFixture(deployFixedListFixture);
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("0.5") });
    expect(await account.periodIncome()).to.equal(ethers.parseEther("0.5"));
  });

  it("redistributionHeld stays 0", async () => {
    const { account, carol } = await loadFixture(deployFixedListFixture);
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("0.5") });
    expect(await account.redistributionHeld()).to.equal(0);
  });

  it("emits PaymentReceived and ForwardedToSeller", async () => {
    const { account, deployer, carol } = await loadFixture(deployFixedListFixture);
    await expect(
      carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("0.5") })
    )
      .to.emit(account, "PaymentReceived")
      .withArgs(carol.address, ethers.parseEther("0.5"), ethers.parseEther("0.5"))
      .and.to.emit(account, "ForwardedToSeller")
      .withArgs(deployer.address, ethers.parseEther("0.5"));
  });
});

// ─── Payment: Above Threshold ─────────────────────────────────────────────────

describe("SmartAccount - Payment: above threshold", () => {
  // threshold=1 ETH, sellerOverflowBps=5000 (50%)
  // Send 2 ETH: 1 ETH below threshold (forwarded), 1 ETH above (50%=0.5 forwarded, 0.5 held)
  // Total forwarded = 1.5 ETH, held = 0.5 ETH

  it("sellerOverflowBps% forwarded, rest held", async () => {
    const { account, deployer, carol } = await loadFixture(deployFixedListFixture);
    const payoutBefore = await getETHBalance(deployer.address);
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("2") });
    const payoutAfter = await getETHBalance(deployer.address);
    expect(payoutAfter - payoutBefore).to.equal(ethers.parseEther("1.5"));
  });

  it("redistributionHeld updated correctly", async () => {
    const { account, carol } = await loadFixture(deployFixedListFixture);
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("2") });
    expect(await account.redistributionHeld()).to.equal(ethers.parseEther("0.5"));
  });

  it("periodIncome updated", async () => {
    const { account, carol } = await loadFixture(deployFixedListFixture);
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("2") });
    expect(await account.periodIncome()).to.equal(ethers.parseEther("2"));
  });

  it("multiple payments accumulate correctly", async () => {
    const { account, carol } = await loadFixture(deployFixedListFixture);
    // First: 0.8 ETH below threshold, held=0
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("0.8") });
    // Second: 0.4 ETH — 0.2 below threshold, 0.2 above (50%=0.1 held)
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("0.4") });
    // Third: 1 ETH fully above (50%=0.5 held)
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("1") });
    // Total held = 0 + 0.1 + 0.5 = 0.6 ETH
    expect(await account.redistributionHeld()).to.equal(ethers.parseEther("0.6"));
    expect(await account.periodIncome()).to.equal(ethers.parseEther("2.2"));
  });
});

// ─── Payment: Straddles Threshold ─────────────────────────────────────────────

describe("SmartAccount - Payment: straddles threshold", () => {
  it("belowPart forwarded fully, abovePart split correctly", async () => {
    const { account, deployer, carol } = await loadFixture(deployFixedListFixture);
    // prefill to 0.8 ETH (fully below, forwarded entirely)
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("0.8") });
    const payoutBefore = await getETHBalance(deployer.address);
    // Straddles: 0.2 below + 0.3 above; seller gets 0.2 + 0.3*50%=0.15 → 0.35
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("0.5") });
    const payoutAfter = await getETHBalance(deployer.address);
    expect(payoutAfter - payoutBefore).to.equal(ethers.parseEther("0.35"));
  });

  it("redistributionHeld = abovePart * (1 - sellerOverflowBps/10000)", async () => {
    const { account, carol } = await loadFixture(deployFixedListFixture);
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("0.8") });
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("0.5") });
    // abovePart = 0.3, held = 0.3 * 50% = 0.15 ETH
    expect(await account.redistributionHeld()).to.equal(ethers.parseEther("0.15"));
  });

  it("payoutAddress receives correct amount", async () => {
    const { account, deployer, carol } = await loadFixture(deployFixedListFixture);
    // First payment: 0.4 ETH, all below threshold, forwarded 0.4
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("0.4") });
    const payoutBefore = await getETHBalance(deployer.address);
    // Second: 1 ETH — straddles: belowPart=0.6, abovePart=0.4, seller gets 0.6+0.4*0.5=0.8
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("1") });
    const payoutAfter = await getETHBalance(deployer.address);
    expect(payoutAfter - payoutBefore).to.equal(ethers.parseEther("0.8"));
  });
});

// ─── Edge cases: sellerOverflowBps ───────────────────────────────────────────

describe("SmartAccount - Edge cases: sellerOverflowBps", () => {
  async function deployWithOverflowBps(overflowBps: number) {
    const base = await deployFactoryFixture();
    const { factory, owner, alice, bob, deployer } = base;
    const stakeholders = [
      { recipient: alice.address, shareBps: 6000 },
      { recipient: bob.address, shareBps: 4000 },
    ];
    const tx = await factory.connect(owner).createAccount(
      deployer.address, ONE_ETH, overflowBps, ONE_DAY, ethers.ZeroAddress, 0, stakeholders, "Test"
    );
    const receipt = await tx.wait();
    const accountAddress = await getAccountFromReceipt(factory, receipt);
    const account = (await ethers.getContractAt("SmartAccount", accountAddress)) as SmartAccount;
    return { ...base, account };
  }

  it("sellerOverflowBps=0: all above-threshold held", async () => {
    const { account, carol } = await deployWithOverflowBps(0);
    // 2 ETH: 1 below (forwarded), 1 above (0%=0 forwarded, 100% held)
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("2") });
    expect(await account.redistributionHeld()).to.equal(ethers.parseEther("1"));
  });

  it("sellerOverflowBps=10000: all forwarded, redistributionHeld always 0", async () => {
    const { account, carol, deployer } = await deployWithOverflowBps(10000);
    const payoutBefore = await getETHBalance(deployer.address);
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("3") });
    const payoutAfter = await getETHBalance(deployer.address);
    expect(await account.redistributionHeld()).to.equal(0);
    expect(payoutAfter - payoutBefore).to.equal(ethers.parseEther("3"));
  });

  it("sellerOverflowBps=5000 with exact threshold payment: nothing held", async () => {
    const { account, carol } = await deployWithOverflowBps(5000);
    // Send exactly threshold (1 ETH) — fully below, nothing held
    await carol.sendTransaction({ to: await account.getAddress(), value: ONE_ETH });
    expect(await account.redistributionHeld()).to.equal(0);
  });
});

// ─── Period Close: FIXED_LIST ─────────────────────────────────────────────────

describe("SmartAccount - Period close: FIXED_LIST", () => {
  it("reverts before period elapses", async () => {
    const { account } = await loadFixture(deployFixedListFixture);
    await expect(account.closePeriod()).to.be.revertedWithCustomError(account, "PeriodNotYetOver");
  });

  it("emits PeriodClosed with correct redistributionPot", async () => {
    const { account, carol } = await loadFixture(deployFixedListFixture);
    // 2 ETH: below=1 (forwarded), above=1, held=1*50%=0.5 ETH
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("2") });
    await time.increase(ONE_DAY + 1);
    await expect(account.closePeriod())
      .to.emit(account, "PeriodClosed")
      .withArgs(0, anyValue, ethers.parseEther("2"), ethers.parseEther("0.5"));
  });

  it("distributes to stakeholders proportionally (alice 60%, bob 40%)", async () => {
    const { account, carol, alice, bob } = await loadFixture(deployFixedListFixture);
    // 3 ETH: below=1 ETH (forwarded), above=2 ETH; held = 2 * 50% = 1 ETH
    // alice 60% of 1 ETH = 0.6, bob 40% = 0.4
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("3") });
    await time.increase(ONE_DAY + 1);
    await account.closePeriod();
    expect(await account.getClaimable(alice.address)).to.equal(ethers.parseEther("0.6"));
    expect(await account.getClaimable(bob.address)).to.equal(ethers.parseEther("0.4"));
  });

  it("resets periodIncome and redistributionHeld to 0", async () => {
    const { account, carol } = await loadFixture(deployFixedListFixture);
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("2") });
    await time.increase(ONE_DAY + 1);
    await account.closePeriod();
    expect(await account.periodIncome()).to.equal(0);
    expect(await account.redistributionHeld()).to.equal(0);
  });

  it("empty period (no redistribution) closes cleanly", async () => {
    const { account } = await loadFixture(deployFixedListFixture);
    await time.increase(ONE_DAY + 1);
    await expect(account.closePeriod()).to.emit(account, "PeriodClosed");
    expect(await account.periodIncome()).to.equal(0);
    expect(await account.redistributionHeld()).to.equal(0);
  });
});

// ─── FIXED_LIST stakeholderClaim ─────────────────────────────────────────────

describe("SmartAccount - FIXED_LIST stakeholderClaim", () => {
  it("transfers correct amount to stakeholder", async () => {
    const { account, carol, alice } = await loadFixture(deployFixedListFixture);
    // 3 ETH: below=1 (forwarded), above=2, held=1 ETH; alice 60% = 0.6 ETH
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("3") });
    await time.increase(ONE_DAY + 1);
    await account.closePeriod();

    const balanceBefore = await getETHBalance(alice.address);
    const tx = await account.connect(alice).stakeholderClaim();
    const receipt = await tx.wait();
    const gasUsed = receipt!.gasUsed * tx.gasPrice!;
    const balanceAfter = await getETHBalance(alice.address);
    expect(balanceAfter - balanceBefore + gasUsed).to.equal(ethers.parseEther("0.6"));
  });

  it("zeroes claimable after claim", async () => {
    const { account, carol, alice } = await loadFixture(deployFixedListFixture);
    // 3 ETH: held=1 ETH, alice gets 0.6 ETH claimable
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("3") });
    await time.increase(ONE_DAY + 1);
    await account.closePeriod();
    await account.connect(alice).stakeholderClaim();
    expect(await account.getClaimable(alice.address)).to.equal(0);
  });

  it("reverts with nothing to claim", async () => {
    const { account, carol } = await loadFixture(deployFixedListFixture);
    await expect(
      account.connect(carol).stakeholderClaim()
    ).to.be.revertedWithCustomError(account, "NothingToWithdraw");
  });

  it("works even when paused (earned funds)", async () => {
    const { account, carol, alice, owner } = await loadFixture(deployFixedListFixture);
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("3") });
    await time.increase(ONE_DAY + 1);
    await account.closePeriod();
    await account.connect(owner).pause();
    await expect(account.connect(alice).stakeholderClaim()).to.not.be.reverted;
  });
});

// ─── Period Close: BUYERS mode ────────────────────────────────────────────────

describe("SmartAccount - Period close: BUYERS mode", () => {
  it("snapshots periodRedistributionPot correctly", async () => {
    const { account, carol } = await loadFixture(deployBuyersFixture);
    // 2 ETH: 0.5 ETH held
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("2") });
    await time.increase(ONE_DAY + 1);
    await account.closePeriod();
    const [pot] = await account.getPeriodRedistributionInfo(0);
    expect(pot).to.equal(ethers.parseEther("0.5"));
  });

  it("snapshots periodTotalContributions correctly", async () => {
    const { account, carol } = await loadFixture(deployBuyersFixture);
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("2") });
    await time.increase(ONE_DAY + 1);
    await account.closePeriod();
    const [, totalContribs] = await account.getPeriodRedistributionInfo(0);
    expect(totalContribs).to.equal(ethers.parseEther("2"));
  });

  it("increments currentPeriodId", async () => {
    const { account } = await loadFixture(deployBuyersFixture);
    expect(await account.currentPeriodId()).to.equal(0);
    await time.increase(ONE_DAY + 1);
    await account.closePeriod();
    expect(await account.currentPeriodId()).to.equal(1);
  });

  it("resets periodIncome and redistributionHeld", async () => {
    const { account, carol } = await loadFixture(deployBuyersFixture);
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("2") });
    await time.increase(ONE_DAY + 1);
    await account.closePeriod();
    expect(await account.periodIncome()).to.equal(0);
    expect(await account.redistributionHeld()).to.equal(0);
  });

  it("multiple periods accumulate correctly (each period has its own pot)", async () => {
    const { account, carol, buyer1 } = await loadFixture(deployBuyersFixture);
    // Period 0: 2 ETH, held=0.5
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("2") });
    await time.increase(ONE_DAY + 1);
    await account.closePeriod();

    // Period 1: 3 ETH — straddles (below=1, above=2, held=2*50%=1)
    await buyer1.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("3") });
    await time.increase(ONE_DAY + 1);
    await account.closePeriod();

    const [pot0] = await account.getPeriodRedistributionInfo(0);
    const [pot1] = await account.getPeriodRedistributionInfo(1);
    expect(pot0).to.equal(ethers.parseEther("0.5"));
    expect(pot1).to.equal(ethers.parseEther("1"));
  });
});

// ─── claimBuyerRedistribution ─────────────────────────────────────────────────

describe("SmartAccount - claimBuyerRedistribution", () => {
  it("buyer claims correct proportional share (single buyer: gets 100% of pot)", async () => {
    const { account, carol } = await loadFixture(deployBuyersFixture);
    // 2 ETH: held = 0.5 ETH
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("2") });
    await time.increase(ONE_DAY + 1);
    await account.closePeriod();

    const balBefore = await getETHBalance(carol.address);
    const tx = await account.connect(carol).claimBuyerRedistribution(0);
    const receipt = await tx.wait();
    const gasUsed = receipt!.gasUsed * tx.gasPrice!;
    const balAfter = await getETHBalance(carol.address);
    expect(balAfter - balBefore + gasUsed).to.equal(ethers.parseEther("0.5"));
  });

  it("two buyers with equal contributions each get 50%", async () => {
    const { account, carol, buyer1 } = await loadFixture(deployBuyersFixture);
    // buyer1: 1.5 ETH → below=1, above=0.5, held=0.25
    // carol: 1.5 ETH (already above threshold) → all above, held=1.5*50%=0.75
    // total held = 1 ETH, total income = 3 ETH
    // buyer1 contrib=1.5, carol contrib=1.5 → each claim 0.5 ETH
    await buyer1.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("1.5") });
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("1.5") });
    await time.increase(ONE_DAY + 1);
    await account.closePeriod();

    const [pot] = await account.getPeriodRedistributionInfo(0);
    expect(pot).to.equal(ethers.parseEther("1"));

    const buyer1BalBefore = await getETHBalance(buyer1.address);
    const tx1 = await account.connect(buyer1).claimBuyerRedistribution(0);
    const r1 = await tx1.wait();
    const gas1 = r1!.gasUsed * tx1.gasPrice!;
    const buyer1BalAfter = await getETHBalance(buyer1.address);
    expect(buyer1BalAfter - buyer1BalBefore + gas1).to.equal(ethers.parseEther("0.5"));

    const carolBalBefore = await getETHBalance(carol.address);
    const tx2 = await account.connect(carol).claimBuyerRedistribution(0);
    const r2 = await tx2.wait();
    const gas2 = r2!.gasUsed * tx2.gasPrice!;
    const carolBalAfter = await getETHBalance(carol.address);
    expect(carolBalAfter - carolBalBefore + gas2).to.equal(ethers.parseEther("0.5"));
  });

  it("two buyers with different contributions: proportional split", async () => {
    const { account, carol, buyer1 } = await loadFixture(deployBuyersFixture);
    // buyer1: 2 ETH → below=1, above=1, held=0.5
    // carol: 4 ETH (fully above after buyer1) → held=4*50%=2
    // total held=2.5, total income=6
    // buyer1 contribution=2, carol=4
    await buyer1.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("2") });
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("4") });
    await time.increase(ONE_DAY + 1);
    await account.closePeriod();

    const [pot, totalContribs] = await account.getPeriodRedistributionInfo(0);
    expect(pot).to.equal(ethers.parseEther("2.5"));
    expect(totalContribs).to.equal(ethers.parseEther("6"));

    const buyer1BalBefore = await getETHBalance(buyer1.address);
    const tx = await account.connect(buyer1).claimBuyerRedistribution(0);
    const receipt = await tx.wait();
    const gasUsed = receipt!.gasUsed * tx.gasPrice!;
    const buyer1BalAfter = await getETHBalance(buyer1.address);

    // Expected: 2.5 * 2 / 6 = 5/6 ETH
    const expectedBuyer1 = (ethers.parseEther("2.5") * 2n) / 6n;
    expect(buyer1BalAfter - buyer1BalBefore + gasUsed).to.equal(expectedBuyer1);
  });

  it("cannot claim before period closes", async () => {
    const { account, carol } = await loadFixture(deployBuyersFixture);
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("2") });
    await expect(
      account.connect(carol).claimBuyerRedistribution(0)
    ).to.be.revertedWithCustomError(account, "PeriodNotClosed");
  });

  it("cannot claim same period twice", async () => {
    const { account, carol } = await loadFixture(deployBuyersFixture);
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("2") });
    await time.increase(ONE_DAY + 1);
    await account.closePeriod();
    await account.connect(carol).claimBuyerRedistribution(0);
    await expect(
      account.connect(carol).claimBuyerRedistribution(0)
    ).to.be.revertedWithCustomError(account, "AlreadyClaimed");
  });

  it("zero-contribution address cannot claim", async () => {
    const { account, carol, buyer1 } = await loadFixture(deployBuyersFixture);
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("2") });
    await time.increase(ONE_DAY + 1);
    await account.closePeriod();
    await expect(
      account.connect(buyer1).claimBuyerRedistribution(0)
    ).to.be.revertedWithCustomError(account, "NothingToWithdraw");
  });

  it("claim works while paused (earned funds)", async () => {
    const { account, carol, owner } = await loadFixture(deployBuyersFixture);
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("2") });
    await time.increase(ONE_DAY + 1);
    await account.closePeriod();
    await account.connect(owner).pause();
    await expect(account.connect(carol).claimBuyerRedistribution(0)).to.not.be.reverted;
  });
});

// ─── Economic params timelock ─────────────────────────────────────────────────

describe("SmartAccount - Economic params timelock", () => {
  it("queue emits event", async () => {
    const { account, owner } = await loadFixture(deployFixedListFixture);
    await expect(account.connect(owner).queueEconomicParamsChange(ethers.parseEther("2"), 3000))
      .to.emit(account, "EconomicParamsChangeQueued");
  });

  it("cannot execute before timelock", async () => {
    const { account, owner } = await loadFixture(deployFixedListFixture);
    await account.connect(owner).queueEconomicParamsChange(ethers.parseEther("2"), 3000);
    await expect(
      account.connect(owner).executeEconomicParamsChange()
    ).to.be.revertedWithCustomError(account, "ChangeNotReady");
  });

  it("executes after timelock", async () => {
    const { account, owner } = await loadFixture(deployFixedListFixture);
    await account.connect(owner).queueEconomicParamsChange(ethers.parseEther("2"), 3000);
    await time.increase(TWO_DAYS + 1);
    await account.connect(owner).executeEconomicParamsChange();
    expect(await account.threshold()).to.equal(ethers.parseEther("2"));
    expect(await account.sellerOverflowBps()).to.equal(3000);
  });

  it("reverts if change already pending", async () => {
    const { account, owner } = await loadFixture(deployFixedListFixture);
    await account.connect(owner).queueEconomicParamsChange(ethers.parseEther("2"), 3000);
    await expect(
      account.connect(owner).queueEconomicParamsChange(ethers.parseEther("3"), 4000)
    ).to.be.revertedWithCustomError(account, "ChangePending");
  });

  it("can cancel", async () => {
    const { account, owner } = await loadFixture(deployFixedListFixture);
    await account.connect(owner).queueEconomicParamsChange(ethers.parseEther("2"), 3000);
    await expect(account.connect(owner).cancelEconomicParamsChange())
      .to.emit(account, "EconomicParamsChangeCancelled");
    expect(await account.economicParamsChangeReadyAt()).to.equal(0);
  });

  it("can queue again after cancel", async () => {
    const { account, owner } = await loadFixture(deployFixedListFixture);
    await account.connect(owner).queueEconomicParamsChange(ethers.parseEther("2"), 3000);
    await account.connect(owner).cancelEconomicParamsChange();
    await expect(
      account.connect(owner).queueEconomicParamsChange(ethers.parseEther("3"), 4000)
    ).to.not.be.reverted;
  });
});

// ─── Payout address timelock ──────────────────────────────────────────────────

describe("SmartAccount - Payout address timelock", () => {
  it("queue emits event", async () => {
    const { account, owner, carol } = await loadFixture(deployFixedListFixture);
    await expect(account.connect(owner).queuePayoutAddressChange(carol.address))
      .to.emit(account, "PayoutAddressChangeQueued")
      .withArgs(carol.address, anyValue);
  });

  it("cannot execute before timelock", async () => {
    const { account, owner, carol } = await loadFixture(deployFixedListFixture);
    await account.connect(owner).queuePayoutAddressChange(carol.address);
    await expect(
      account.connect(owner).executePayoutAddressChange()
    ).to.be.revertedWithCustomError(account, "ChangeNotReady");
  });

  it("executes and new address used for forward", async () => {
    const { account, owner, carol, buyer1 } = await loadFixture(deployFixedListFixture);
    await account.connect(owner).queuePayoutAddressChange(carol.address);
    await time.increase(TWO_DAYS + 1);
    await account.connect(owner).executePayoutAddressChange();
    expect(await account.payoutAddress()).to.equal(carol.address);

    const carolBalBefore = await getETHBalance(carol.address);
    await buyer1.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("0.5") });
    const carolBalAfter = await getETHBalance(carol.address);
    expect(carolBalAfter - carolBalBefore).to.equal(ethers.parseEther("0.5"));
  });

  it("can cancel", async () => {
    const { account, owner, carol } = await loadFixture(deployFixedListFixture);
    await account.connect(owner).queuePayoutAddressChange(carol.address);
    await account.connect(owner).cancelPayoutAddressChange();
    expect(await account.payoutAddressChangeReadyAt()).to.equal(0);
  });

  it("reverts if pending when queueing again", async () => {
    const { account, owner, carol, buyer1 } = await loadFixture(deployFixedListFixture);
    await account.connect(owner).queuePayoutAddressChange(carol.address);
    await expect(
      account.connect(owner).queuePayoutAddressChange(buyer1.address)
    ).to.be.revertedWithCustomError(account, "ChangePending");
  });
});

// ─── Stakeholders timelock (FIXED_LIST) ───────────────────────────────────────

describe("SmartAccount - Stakeholders timelock (FIXED_LIST)", () => {
  it("queue, wait, execute: replaces list", async () => {
    const { account, owner, carol, buyer1 } = await loadFixture(deployFixedListFixture);
    const newStakeholders = [
      { recipient: carol.address, shareBps: 7000 },
      { recipient: buyer1.address, shareBps: 3000 },
    ];
    await account.connect(owner).queueStakeholdersChange(newStakeholders);
    await time.increase(TWO_DAYS + 1);
    await account.connect(owner).executeStakeholdersChange();
    const list = await account.getStakeholders();
    expect(list[0].recipient).to.equal(carol.address);
    expect(list[1].recipient).to.equal(buyer1.address);
  });

  it("cannot execute before timelock", async () => {
    const { account, owner, carol, buyer1 } = await loadFixture(deployFixedListFixture);
    const newStakeholders = [
      { recipient: carol.address, shareBps: 7000 },
      { recipient: buyer1.address, shareBps: 3000 },
    ];
    await account.connect(owner).queueStakeholdersChange(newStakeholders);
    await expect(
      account.connect(owner).executeStakeholdersChange()
    ).to.be.revertedWithCustomError(account, "ChangeNotReady");
  });

  it("existing claimable preserved after update", async () => {
    const { account, owner, carol, buyer1, alice } = await loadFixture(deployFixedListFixture);
    // Give alice some claimable
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("3") });
    await time.increase(ONE_DAY + 1);
    await account.closePeriod();
    const aliceClaimable = await account.getClaimable(alice.address);
    expect(aliceClaimable).to.be.gt(0);

    // Replace stakeholders
    const newStakeholders = [
      { recipient: carol.address, shareBps: 7000 },
      { recipient: buyer1.address, shareBps: 3000 },
    ];
    await account.connect(owner).queueStakeholdersChange(newStakeholders);
    await time.increase(TWO_DAYS + 1);
    await account.connect(owner).executeStakeholdersChange();
    expect(await account.getClaimable(alice.address)).to.equal(aliceClaimable);
  });

  it("cancel clears pending", async () => {
    const { account, owner, carol, buyer1 } = await loadFixture(deployFixedListFixture);
    const newStakeholders = [
      { recipient: carol.address, shareBps: 7000 },
      { recipient: buyer1.address, shareBps: 3000 },
    ];
    await account.connect(owner).queueStakeholdersChange(newStakeholders);
    await account.connect(owner).cancelStakeholdersChange();
    expect(await account.stakeholdersChangeReadyAt()).to.equal(0);
    const pending = await account.getPendingStakeholders();
    expect(pending.length).to.equal(0);
  });

  it("reverts in BUYERS mode", async () => {
    const { account, owner, carol, buyer1 } = await loadFixture(deployBuyersFixture);
    const newStakeholders = [
      { recipient: carol.address, shareBps: 7000 },
      { recipient: buyer1.address, shareBps: 3000 },
    ];
    await expect(
      account.connect(owner).queueStakeholdersChange(newStakeholders)
    ).to.be.revertedWithCustomError(account, "WrongMode");
  });
});

// ─── Period duration deferred ─────────────────────────────────────────────────

describe("SmartAccount - Period duration deferred", () => {
  it("stores as pending, doesn't apply immediately", async () => {
    const { account, owner } = await loadFixture(deployFixedListFixture);
    const newDuration = 2 * ONE_DAY;
    await account.connect(owner).updatePeriodDuration(newDuration);
    expect(await account.periodDuration()).to.equal(ONE_DAY);
    expect(await account.pendingPeriodDuration()).to.equal(newDuration);
  });

  it("applies at next closePeriod", async () => {
    const { account, owner } = await loadFixture(deployFixedListFixture);
    const newDuration = 2 * ONE_DAY;
    await account.connect(owner).updatePeriodDuration(newDuration);
    await time.increase(ONE_DAY + 1);
    await account.closePeriod();
    expect(await account.periodDuration()).to.equal(newDuration);
    expect(await account.pendingPeriodDuration()).to.equal(0);
  });

  it("emits PeriodDurationUpdated at close", async () => {
    const { account, owner } = await loadFixture(deployFixedListFixture);
    const newDuration = 2 * ONE_DAY;
    await account.connect(owner).updatePeriodDuration(newDuration);
    await time.increase(ONE_DAY + 1);
    await expect(account.closePeriod())
      .to.emit(account, "PeriodDurationUpdated")
      .withArgs(newDuration);
  });
});

// ─── Pause ────────────────────────────────────────────────────────────────────

describe("SmartAccount - Pause", () => {
  it("paused account rejects payments", async () => {
    const { account, owner, carol } = await loadFixture(deployFixedListFixture);
    await account.connect(owner).pause();
    await expect(
      carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("0.5") })
    ).to.be.reverted;
  });

  it("paused account rejects closePeriod", async () => {
    const { account, owner } = await loadFixture(deployFixedListFixture);
    await account.connect(owner).pause();
    await time.increase(ONE_DAY + 1);
    await expect(account.closePeriod()).to.be.reverted;
  });

  it("paused does NOT reject stakeholderClaim (FIXED_LIST)", async () => {
    const { account, carol, alice, owner } = await loadFixture(deployFixedListFixture);
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("3") });
    await time.increase(ONE_DAY + 1);
    await account.closePeriod();
    await account.connect(owner).pause();
    await expect(account.connect(alice).stakeholderClaim()).to.not.be.reverted;
  });

  it("paused does NOT reject claimBuyerRedistribution (BUYERS)", async () => {
    const { account, carol, owner } = await loadFixture(deployBuyersFixture);
    await carol.sendTransaction({ to: await account.getAddress(), value: ethers.parseEther("2") });
    await time.increase(ONE_DAY + 1);
    await account.closePeriod();
    await account.connect(owner).pause();
    await expect(account.connect(carol).claimBuyerRedistribution(0)).to.not.be.reverted;
  });
});

// ─── Gelato ───────────────────────────────────────────────────────────────────

describe("SmartAccount - Gelato", () => {
  it("checkUpkeep false before period", async () => {
    const { account } = await loadFixture(deployFixedListFixture);
    const [upkeepNeeded] = await account.checkUpkeep("0x");
    expect(upkeepNeeded).to.be.false;
  });

  it("checkUpkeep true after period", async () => {
    const { account } = await loadFixture(deployFixedListFixture);
    await time.increase(ONE_DAY + 1);
    const [upkeepNeeded] = await account.checkUpkeep("0x");
    expect(upkeepNeeded).to.be.true;
  });

  it("performUpkeep closes period", async () => {
    const { account } = await loadFixture(deployFixedListFixture);
    await time.increase(ONE_DAY + 1);
    await expect(account.performUpkeep("0x")).to.emit(account, "PeriodClosed");
  });
});

// ─── sellerClaim escape hatch ─────────────────────────────────────────────────

describe("SmartAccount - sellerClaim escape hatch", () => {
  it("can claim sellerClaimable when payoutAddress initially rejects ETH", async () => {
    // Use the factory's own address as payout — factory has no receive(), so ETH forwards fail
    const { factory, owner, alice, bob } = await loadFixture(deployFactoryFixture);

    const stakeholders = [
      { recipient: alice.address, shareBps: 6000 },
      { recipient: bob.address, shareBps: 4000 },
    ];

    const tx = await factory.connect(owner).createAccount(
      await factory.getAddress(), // rejecter: no receive()
      ONE_ETH,
      5000,
      ONE_DAY,
      ethers.ZeroAddress,
      0,
      stakeholders,
      "Escape Hatch Test"
    );
    const receipt = await tx.wait();
    const accountAddress = await getAccountFromReceipt(factory, receipt);
    const account = (await ethers.getContractAt("SmartAccount", accountAddress)) as SmartAccount;

    const [,,,,,, carol] = await ethers.getSigners();

    // Send 0.5 ETH: fully below threshold, forward fails → sellerClaimable accumulates
    await carol.sendTransaction({ to: accountAddress, value: ethers.parseEther("0.5") });
    expect(await account.sellerClaimable()).to.equal(ethers.parseEther("0.5"));

    // Change payout address to owner (valid receiver)
    await account.connect(owner).queuePayoutAddressChange(owner.address);
    await time.increase(TWO_DAYS + 1);
    await account.connect(owner).executePayoutAddressChange();

    // Owner recovers the stuck ETH
    const ownerBalBefore = await getETHBalance(owner.address);
    const claimTx = await account.connect(owner).sellerClaim();
    const claimReceipt = await claimTx.wait();
    const gasUsed = claimReceipt!.gasUsed * claimTx.gasPrice!;
    const ownerBalAfter = await getETHBalance(owner.address);

    expect(ownerBalAfter - ownerBalBefore + gasUsed).to.equal(ethers.parseEther("0.5"));
    expect(await account.sellerClaimable()).to.equal(0);
  });
});

// ─── Dust/rounding ───────────────────────────────────────────────────────────

describe("SmartAccount - Dust/rounding", () => {
  it("FIXED_LIST: total distributed = redistributionHeld exactly (no dust)", async () => {
    const { account, carol, alice, bob } = await loadFixture(deployFixedListFixture);

    // Odd amount to stress rounding: 2 ETH + 1 wei
    // above threshold = 1 ETH + 1 wei; held = (1000000000000000001 * 50%) / 10000
    const oddAmount = ethers.parseEther("2") + 1n;
    await carol.sendTransaction({ to: await account.getAddress(), value: oddAmount });

    const held = await account.redistributionHeld();
    await time.increase(ONE_DAY + 1);
    await account.closePeriod();

    const aliceClaim = await account.getClaimable(alice.address);
    const bobClaim = await account.getClaimable(bob.address);

    // Last stakeholder absorbs dust: sum must equal exactly held
    expect(aliceClaim + bobClaim).to.equal(held);
  });
});
