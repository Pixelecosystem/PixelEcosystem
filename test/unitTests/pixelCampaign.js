import {createWeb3, deployContract, expectThrow, increaseTimeTo, durationInit, latestTime} from 'ethworks-solidity';
import pixelTokenJson from '../../build/contracts/PixelToken.json';
import pixelCampaignJson from '../../build/contracts/PixelCampaign.json';
import whitelistJson from '../../build/contracts/Whitelist.json';
import Web3 from 'web3';
import chai from 'chai';
import bnChai from 'bn-chai';

const {expect} = chai;
const web3 = createWeb3(Web3);
chai.use(bnChai(web3.utils.BN));

describe('PixelCampaign', () => {
  const {BN} = web3.utils;
  const duration = durationInit(web3);
  let whitelistOwner;
  let whitelistContact;
  let whitelistContractAddress;
  let tokenOwner;
  let tokenContract;
  let tokenContractAddress;
  let influencer;
  let brand;
  let campaingArgs;
  let campaignContract;
  let campaignContractAddress;
  let accounts;
  let notWhitelistedInfluencer;
  let verifier;
  let deadline;
  let fan1;
  let fan2;
  const tokenCap = new BN(500000000);
  const criteria = '<soft criteria text>';
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  const influencerTotalAllocation = new BN('1000');
  const fanSingleAllocation = new BN('10');
  const verifierSingleAllocation = new BN('1');
  const fanCount = new BN('5');
  const funding = influencerTotalAllocation.add(fanSingleAllocation.mul(fanCount)).add(verifierSingleAllocation.mul(fanCount));

  const STATE_UNFUNDED = '0';
  const STATE_FUNDED = '1';
  const STATE_ACCEPTED = '2';
  const STATE_INFLUENCERFUNDSRELEASED = '3';
  const STATE_DISAPPROVED = '4';

  const balanceOf = async (client) => tokenContract.methods.balanceOf(client).call({from: tokenOwner});
  const accept = async (influencer) => campaignContract.methods.accept().send({from: influencer});
  const advanceToAfterDeadline = async () => increaseTimeTo(web3, deadline.add(duration.hours(12)));
  const disapprove = async (from) => campaignContract.methods.disapprove().send({from});
  const releaseInfluencerFunds = async (from) => campaignContract.methods.releaseInfluencerFunds().send({from});
  const releaseFanFunds = async (fan, from) => campaignContract.methods.releaseFanFunds(fan).send({from});
  const getCurrentState = async () => campaignContract.methods.currentState().call();
  const isDisapproved = async () => (await getCurrentState()) === STATE_DISAPPROVED;
  const influencerFundsReleased = async() => (await getCurrentState()) === STATE_INFLUENCERFUNDSRELEASED;

  before(async () => {
    accounts = await web3.eth.getAccounts();
    [, tokenOwner, whitelistOwner, influencer, brand, notWhitelistedInfluencer, verifier, fan1, fan2] = accounts;
  });

  beforeEach(async () => {
    // PixelToken
    const tokenArgs = [tokenCap];
    tokenContract = await deployContract(web3, pixelTokenJson, tokenOwner, tokenArgs);
    tokenContractAddress = tokenContract.options.address;

    // PixelToken minting and allowance
    await tokenContract.methods.mint(brand, tokenCap).send({from: tokenOwner});
    await tokenContract.methods.finishMinting().send({from: tokenOwner});

    // Whitelist
    whitelistContact = await deployContract(web3, whitelistJson, whitelistOwner, []);
    await whitelistContact.methods.add(influencer).send({from: whitelistOwner});
    whitelistContractAddress = whitelistContact.options.address;

    const now = new BN(await latestTime(web3));
    deadline = new BN(now.add(duration.days(1)));
    // Pixel Campaign
    campaingArgs = [
      tokenContractAddress,
      whitelistContractAddress,
      criteria,
      deadline,
      verifier
    ];
    campaignContract = await deployContract(web3, pixelCampaignJson, brand, campaingArgs);
    campaignContractAddress = campaignContract.options.address;

    // funding
    await tokenContract.methods.increaseApproval(campaignContractAddress, funding).send({from: brand});
    await campaignContract.methods.fund(influencerTotalAllocation, fanSingleAllocation, verifierSingleAllocation, fanCount).send({from: brand});
  });

  describe('Creating campaign', async () => {
    const testShouldFailToCreate = async (args) => {
      await expectThrow(deployContract(web3, pixelCampaignJson, brand, args));
    };

    it('Should not allow to create campaign without token or whitelist address', async () => {
      await testShouldFailToCreate([tokenContractAddress, '0x0', criteria, deadline, verifier]);
      await testShouldFailToCreate(['0x0', whitelistContractAddress, criteria, deadline, verifier]);
    });

    it('Should not allow to create campaign without criteria', async () => {
      await testShouldFailToCreate([tokenContractAddress, whitelistContractAddress, '', deadline, verifier]);
    });

    it('Should not allow to create campaign with invalid deadline', async () => {
      const now = new BN(await latestTime(web3));
      await testShouldFailToCreate([tokenContractAddress, whitelistContractAddress, criteria, now - 10, verifier]);
    });

    it('Should not allow to create campaign without verifier', async () => {
      await testShouldFailToCreate([tokenContractAddress, whitelistContractAddress, criteria, deadline, zeroAddress]);
    });
  });

  describe('Funding', async () => {
    const isFunded = async (campaign) => (await campaign.methods.currentState().call()) === STATE_FUNDED;
    let unfundedCampaign;

    const increaseApproval = async() => {
      await tokenContract.methods.increaseApproval(unfundedCampaign.options.address, funding).send({from: brand});
    };

    const fund = async (args) => {
      await unfundedCampaign.methods.fund.apply(this, args).send({from: brand});
    };
    const fundArgs = [influencerTotalAllocation, fanSingleAllocation, verifierSingleAllocation, fanCount];

    const testShouldFund = async (args) => {
      await fund(args);
      expect(await isFunded(unfundedCampaign)).to.be.true;
    };

    const testShouldNotFund = async (args) => {
      await expectThrow(fund(args));
      expect(await isFunded(unfundedCampaign)).to.be.false;
      expect(await balanceOf(unfundedCampaign.options.address)).to.eq.BN(0);
    };

    beforeEach(async () => {
      unfundedCampaign = await deployContract(web3, pixelCampaignJson, brand, campaingArgs);
    });

    it('Should not be funded initially', async () => {
      expect(await isFunded(unfundedCampaign)).to.be.false;
    });

    it('Should allow to fund', async () => {
      await increaseApproval();
      await testShouldFund(fundArgs);
      expect(await balanceOf(unfundedCampaign.options.address)).to.eq.BN(funding);
    });

    it('Should not allow to fund without allowing tokens', async () => {
      await testShouldNotFund(fundArgs);
    });

    it('Should not allow to fund if brand does not have enough token balance', async () => {
      await increaseApproval();
      await tokenContract.methods.transfer(fan2, await balanceOf(brand)).send({from: brand});
      await testShouldNotFund(fundArgs);
    });

    it('Should not allow to fund without influencer funds', async () => {
      await increaseApproval();
      await testShouldNotFund([0, fanSingleAllocation, verifierSingleAllocation, fanCount]);
    });

    it('Should allow to fund without fans', async () => {
      await increaseApproval();
      await testShouldFund([influencerTotalAllocation, 0, 0, 0]);
      expect(await balanceOf(unfundedCampaign.options.address)).to.eq.BN(influencerTotalAllocation);
    });
  });

  describe('Accepting campaign', async () => {
    const testShouldAccept = async (from) => {
      expect(await getCurrentState()).to.not.be.equal(STATE_ACCEPTED);
      await accept(from);
      expect(await campaignContract.methods.influencer().call()).to.be.equal(from);
      expect(await getCurrentState()).to.be.equal(STATE_ACCEPTED);
    };

    const testShouldNotAccept = async (from) => {
      const initialState = await getCurrentState();
      const initialInfluencer = await campaignContract.methods.influencer().call();
      await expectThrow(accept(from));
      expect(await campaignContract.methods.influencer().call()).to.be.equal(initialInfluencer);
      expect(await getCurrentState()).to.be.equal(initialState);
    };

    it('Should allow to be accepted by whitelisted influencer', async () => {
      await testShouldAccept(influencer);
    });

    it('Should not allow to be accepted by not whitelisted influencer', async () => {
      await testShouldNotAccept(notWhitelistedInfluencer);
    });

    it('Should not allow to be accepted twice', async () => {
      await testShouldAccept(influencer);
      await testShouldNotAccept(notWhitelistedInfluencer);
    });

    it('Should not allow to accept if not funded', async () => {
      const unfundedCampaign = await deployContract(web3, pixelCampaignJson, brand, campaingArgs);
      await expectThrow(unfundedCampaign.methods.accept().send({from: influencer}));
      expect(await unfundedCampaign.methods.influencer().call()).to.be.equal(zeroAddress);
    });

    it('Should allow to accept after deadline', async () => {
      await advanceToAfterDeadline();
      await testShouldAccept(influencer);
    });

    it('Should not allow to accept if disapproved', async () => {
      await advanceToAfterDeadline();
      await disapprove(brand);
      await testShouldNotAccept(influencer);
    });
  });

  describe('Disapproving', async () => {
    const testShouldDisapprove = async (from) => {
      const initialBalance = new BN(await balanceOf(from));
      await disapprove(from);
      expect(await isDisapproved()).to.be.true;
      expect(await balanceOf(from)).to.eq.BN(initialBalance.add(influencerTotalAllocation));
    };

    const testShouldNotDisapprove = async (from) => {
      const initialBalance = new BN(await balanceOf(from));
      const initialState = await getCurrentState();
      await expectThrow(disapprove(from));
      expect(await getCurrentState()).to.be.equal(initialState);
      expect(await balanceOf(from)).to.eq.BN(initialBalance);
    };
    
    it('Should allow to be disapproved by the brand', async () => {
      await advanceToAfterDeadline();
      await testShouldDisapprove(brand);
    });

    it('Should not allow to be disapproved befere deadline', async () => {
      await testShouldNotDisapprove(brand);
    });

    it('Should not allow to be disapproved by anyone other than the brand', async () => {
      await advanceToAfterDeadline();
      await testShouldNotDisapprove(fan1);
      await testShouldNotDisapprove(influencer);
      await testShouldNotDisapprove(verifier);
    });

    it('Should not allow to be disapproved twice', async () => {
      await advanceToAfterDeadline();
      await disapprove(brand);
      await testShouldNotDisapprove(brand);
    });
  });

  describe('Releasing influencer funds', async () => {
    const testShouldReleaseInfluencerFunds = async (from) => {
      const initialBalance = new BN(await balanceOf(influencer));
      await releaseInfluencerFunds(from);
      expect(await influencerFundsReleased()).to.be.equal(true);
      expect(await balanceOf(influencer)).to.be.eq.BN(initialBalance.add(influencerTotalAllocation));
    };

    const testShouldNotReleaseInfluencerFunds = async (from) => {
      const initialBalance = new BN(await balanceOf(campaignContractAddress));
      const initialState = await getCurrentState();
      await expectThrow(releaseInfluencerFunds(from));
      expect(await getCurrentState()).to.be.equal(initialState);
      expect(await balanceOf(campaignContractAddress)).to.be.eq.BN(initialBalance);
    };

    it('Should allow to release influencer funds by the brand', async () => {
      await accept(influencer);
      await testShouldReleaseInfluencerFunds(brand);
    });

    it('Should not allow to release influencer funds by anyone other than the brand', async () => {
      await accept(influencer);
      await testShouldNotReleaseInfluencerFunds(influencer);
      await testShouldNotReleaseInfluencerFunds(verifier);
    });

    it('Should not allow to release influencer funds twice', async () => {
      await accept(influencer);
      await testShouldReleaseInfluencerFunds(brand);
      await testShouldNotReleaseInfluencerFunds(brand);
    });

    it('Should allow to release influencer funds by the brand after deadline', async () => {
      await accept(influencer);
      await advanceToAfterDeadline();
      await testShouldReleaseInfluencerFunds(brand);
    });

    it('Should not allow to release influencer funds if challenge not accepted', async () => {
      await testShouldNotReleaseInfluencerFunds(brand);
    });
  });

  describe('Releasing and disapproving', async () => {
    beforeEach(async () => {
      await accept(influencer);
      await advanceToAfterDeadline();
    });

    it('Should not allow to release influencer funds after disapproving', async () => {
      await disapprove(brand);
      await expectThrow(releaseInfluencerFunds(brand));
      expect(await isDisapproved()).to.be.equal(true);
      expect(await influencerFundsReleased()).to.be.equal(false);
    });

    it('Should not allow to disapprove after releasing influencer funds', async () => {
      await releaseInfluencerFunds(brand);
      await expectThrow(disapprove(brand));
      expect(await influencerFundsReleased()).to.be.equal(true);
      expect(await isDisapproved()).to.be.equal(false);
    });
  });

  const releaseAllFanFunds = async () => {
    let i; // eslint-disable-line id-length
    for (i = 0; i < fanCount.toNumber(); i++) {
      await releaseFanFunds(fan1, verifier);
    }
  };

  describe('Releasing fan funds', async () => {
    const testShouldReleaseFanFunds = async (fan, from) => {
      const initialFanBalance = new BN(await balanceOf(fan));
      const initialVerifierBalance = new BN(await balanceOf(verifier));
      await releaseFanFunds(fan, from);
      expect(await balanceOf(fan)).to.be.eq.BN(initialFanBalance.add(fanSingleAllocation));
      expect(await balanceOf(verifier)).to.be.eq.BN(initialVerifierBalance.add(verifierSingleAllocation));
    };

    const testShouldNotReleaseFanFunds = async (fan, from) => {
      const initialFanBalance = new BN(await balanceOf(fan));
      const initialVerifierBalance = new BN(await balanceOf(verifier));
      await expectThrow(releaseFanFunds(fan, from));
      expect(await balanceOf(fan)).to.be.eq.BN(initialFanBalance);
      expect(await balanceOf(verifier)).to.be.eq.BN(initialVerifierBalance);
    };

    it('Should allow to release fan funds', async () => {
      await testShouldReleaseFanFunds(fan1, verifier);
    });

    it('Should allow to release funds for the same fan multiple times', async () => {
      await testShouldReleaseFanFunds(fan1, verifier);
      await testShouldReleaseFanFunds(fan2, verifier);
      await testShouldReleaseFanFunds(fan2, verifier);
      await testShouldReleaseFanFunds(fan1, verifier);
    });

    it('Should not allow to release fan funds by anyone other than verifier', async () => {
      await testShouldNotReleaseFanFunds(fan1, fan1);
      await testShouldNotReleaseFanFunds(fan1, brand);
    });

    it('Should allow to release fan funds after deadline', async () => {
      await advanceToAfterDeadline();
      await testShouldReleaseFanFunds(fan1, verifier);
    });

    it('Should allow to release fan funds after disapproving', async () => {
      await advanceToAfterDeadline();
      await disapprove(brand);
      await testShouldReleaseFanFunds(fan1, verifier);
    });

    it('Should allow to release fan funds after relasing infuencer funds', async () => {
      await accept(influencer);
      await releaseInfluencerFunds(brand);
      await testShouldReleaseFanFunds(fan1, verifier);
    });

    it('Should not allow to release more fan funds than the fan count', async () => {
      await releaseAllFanFunds();
      await testShouldNotReleaseFanFunds(fan1, verifier);
    });
  });

  it('Should release all token balance after releasing all fan, verifier and influencer funds', async () => {
    await accept(influencer);
    await releaseInfluencerFunds(brand);
    await releaseAllFanFunds();
    expect(await balanceOf(campaignContractAddress)).to.eq.BN(0);
  });
});
