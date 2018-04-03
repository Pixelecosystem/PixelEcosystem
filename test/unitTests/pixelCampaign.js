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
  const tokenCap = new BN(500000000);
  const criteria = '<soft criteria text>';
  const zeroAddress = '0x0000000000000000000000000000000000000000';
  const influencerTotalAllocation = new BN('1000');
  const fanSingleAllocation = new BN('10');
  const verifierSingleAllocation = new BN('1');
  const fanCount = new BN('3');
  const funding = influencerTotalAllocation.add(fanSingleAllocation.mul(fanCount)).add(verifierSingleAllocation.mul(fanCount));

  const balanceOf = async (client) => tokenContract.methods.balanceOf(client).call({from: tokenOwner});
  const accept = async (influencer) => campaignContract.methods.accept().send({from: influencer});
  const advanceToAfterDeadline = async () => increaseTimeTo(web3, deadline.add(duration.hours(12)));
  const disapprove = async (from) => campaignContract.methods.disapprove().send({from});
  const releaseInfluencerFunds = async (from) => campaignContract.methods.releaseInfluencerFunds().send({from});

  before(async () => {
    accounts = await web3.eth.getAccounts();
    [, tokenOwner, whitelistOwner, influencer, brand, notWhitelistedInfluencer, verifier] = accounts;
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
      const now = new BN(await latestTime(web3));
      await testShouldFailToCreate([tokenContractAddress, whitelistContractAddress, criteria, deadline, zeroAddress]);
    });
  });

  describe('Funding', async () => {
    it('Should not be funded initially', async () => {
      const unfundedCampaign = await deployContract(web3, pixelCampaignJson, brand, campaingArgs);
      expect(await unfundedCampaign.methods.isFunded().call()).to.be.false;
    });

    it('Should allow to fund', async () => {
      const unfundedCampaign = await deployContract(web3, pixelCampaignJson, brand, campaingArgs);
      await tokenContract.methods.increaseApproval(unfundedCampaign.options.address, funding).send({from: brand});
      await unfundedCampaign.methods.fund(influencerTotalAllocation, fanSingleAllocation, verifierSingleAllocation, fanCount).send({from: brand});
      expect(await unfundedCampaign.methods.isFunded().call()).to.be.true;
      expect(await balanceOf(unfundedCampaign.options.address)).to.eq.BN(funding);
    });

    it('Should not allow to fund without allowing tokens', async () => {
      const unfundedCampaign = await deployContract(web3, pixelCampaignJson, brand, campaingArgs);
      await expectThrow(unfundedCampaign.methods.fund(influencerTotalAllocation, fanSingleAllocation, verifierSingleAllocation, fanCount).send({from: brand}));
      expect(await unfundedCampaign.methods.isFunded().call()).to.be.false;
      expect(await balanceOf(unfundedCampaign.options.address)).to.eq.BN(0);
    });

    it('Should not allow to fund without influencer funds', async () => {
      const unfundedCampaign = await deployContract(web3, pixelCampaignJson, brand, campaingArgs);
      await tokenContract.methods.increaseApproval(unfundedCampaign.options.address, funding).send({from: brand});
      await expectThrow(unfundedCampaign.methods.fund(0, fanSingleAllocation, verifierSingleAllocation, fanCount).send({from: brand}));
      expect(await unfundedCampaign.methods.isFunded().call()).to.be.false;
      expect(await balanceOf(unfundedCampaign.options.address)).to.eq.BN(0);
    });

    it('Should allow to fund without fans', async () => {
      const unfundedCampaign = await deployContract(web3, pixelCampaignJson, brand, campaingArgs);
      await tokenContract.methods.increaseApproval(unfundedCampaign.options.address, funding).send({from: brand});
      await unfundedCampaign.methods.fund(influencerTotalAllocation, 0, 0, 0).send({from: brand});
      expect(await unfundedCampaign.methods.isFunded().call()).to.be.true;
      expect(await balanceOf(unfundedCampaign.options.address)).to.eq.BN(influencerTotalAllocation);
    });
  });

  describe('Accepting campaign', async () => {
    it('Should allow to be accepted by whitelisted influencer', async () => {
      await accept(influencer);
      expect(await campaignContract.methods.influencer().call()).to.be.equal(influencer);
    });

    it('Should not allow to be accepted by not whitelisted influencer', async () => {
      await expectThrow(accept(notWhitelistedInfluencer));
      expect(await campaignContract.methods.influencer().call()).to.be.equal(zeroAddress);
    });

    it('Should not allow to be accepted twice', async () => {
      await accept(influencer);
      await expectThrow(accept(influencer));
    });

    it('Should not allow to accept if not funded', async () => {
      const unfundedCampaign = await deployContract(web3, pixelCampaignJson, brand, campaingArgs);
      await expectThrow(unfundedCampaign.methods.accept().send({from: influencer}));
      expect(await unfundedCampaign.methods.influencer().call()).to.be.equal(zeroAddress);
    });

    it('Should allow to accept after deadline', async () => {
      await advanceToAfterDeadline();
      await accept(influencer);
      expect(await campaignContract.methods.influencer().call()).to.be.equal(influencer);
    });

    it('Should not allow to accept if disapproved', async () => {
      await advanceToAfterDeadline();
      await disapprove(brand);
      await expectThrow(accept(influencer));
      expect(await campaignContract.methods.influencer().call()).to.be.equal(zeroAddress);
    });
  });

  describe('Disapproving', async () => {
    it('Should not allow to be disapproved befere deadline', async () => {
      await expectThrow(disapprove(brand));
    });

    it('Should not allow to be disapproved by anyone other than the brand', async () => {
      await advanceToAfterDeadline();
      await expectThrow(disapprove(influencer));
      await expectThrow(disapprove(verifier));
    });

    it('Should allow to be disapproved by the brand', async () => {
      await advanceToAfterDeadline();
      const initialBalance = new BN(await balanceOf(brand));
      await disapprove(brand);
      expect(await balanceOf(brand)).to.eq.BN(initialBalance.add(influencerTotalAllocation));
    });

    it('Should not allow to be disapproved twice', async () => {
      await advanceToAfterDeadline();
      await disapprove(brand);
      await expectThrow(disapprove(brand));
    });
  });

  describe('Releasing influencer funds', async () => {
    it('Should allow to release influencer funds by the brand', async () => {
      await accept(influencer);
      const initialBalance = new BN(await balanceOf(influencer));
      await releaseInfluencerFunds(brand);
      expect(await balanceOf(influencer)).to.be.eq.BN(initialBalance.add(influencerTotalAllocation));
    });

    it('Should not allow to release influencer funds by anyone other than the brand', async () => {
      const initialBalance = new BN(await balanceOf(campaignContractAddress));
      await expectThrow(releaseInfluencerFunds(influencer));
      await expectThrow(releaseInfluencerFunds(verifier));
      expect(await balanceOf(campaignContractAddress)).to.be.eq.BN(initialBalance);
    });

    it('Should not allow to release influencer funds twice', async () => {
      await accept(influencer);
      await releaseInfluencerFunds(brand);
      await expectThrow(releaseInfluencerFunds(brand));
    });

    it('Should allow to release influencer funds by the brand after deadline', async () => {
      await accept(influencer);
      const initialBalance = new BN(await balanceOf(influencer));
      await advanceToAfterDeadline();
      await releaseInfluencerFunds(brand);
      expect(await balanceOf(influencer)).to.be.eq.BN(initialBalance.add(influencerTotalAllocation));
    });

    it('Should not allow to release influencer funds if challenge not accepted', async () => {
      const initialBalance = new BN(await balanceOf(campaignContractAddress));
      await expectThrow(releaseInfluencerFunds(brand));
      expect(await balanceOf(campaignContractAddress)).to.be.eq.BN(initialBalance);
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
      expect(await campaignContract.methods.disapproved().call()).to.be.equal(true);
      expect(await campaignContract.methods.influencerFundsReleased().call()).to.be.equal(false);
    });

    it('Should not allow to disapprove after releasing influencer funds', async () => {
      await releaseInfluencerFunds(brand);
      await expectThrow(disapprove(brand));
      expect(await campaignContract.methods.influencerFundsReleased().call()).to.be.equal(true);
      expect(await campaignContract.methods.disapproved().call()).to.be.equal(false);
    });
  });

  xdescribe('Releasing fan funds', async () => {
    it('Should allow to release fan funds', async () => {

    });

    it('Should not allow to release fan funds by anyone other than verifier', async () => {

    });

    it('Should allow to release fan funds after disapproving', async () => {

    });

    it('Should allow to release fan funds after relasing infuencer funds', async () => {

    });

    it('Should allow to release fan funds after deadline', async () => {

    });

    it('Should release all verifier and fan funds after releasing for all fans', async () => {

    });

    it('Should not allow to release more fan funds than the fan count', async () => {

    });
  });
});
