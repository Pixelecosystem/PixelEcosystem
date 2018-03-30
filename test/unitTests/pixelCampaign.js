import {createWeb3, deployContract, expectThrow} from '../testUtils.js';
import pixelTokenJson from '../../build/contracts/PixelToken.json';
import pixelCampaignJson from '../../build/contracts/PixelCampaign.json';
import whitelistJson from '../../build/contracts/Whitelist.json';
import chai from 'chai';
import bnChai from 'bn-chai';

const {expect} = chai;
const web3 = createWeb3();
chai.use(bnChai(web3.utils.BN));

describe('PixelCampaing', () => {
  const web3 = createWeb3();
  const {BN} = web3.utils;
  let whitelistOwner;
  let whitelistContact;
  let whitelistAddress;
  let tokenOwner;
  let tokenContract;
  let tokenContractAddress;
  let influencer;
  let brand;
  let campaignContract;
  let accounts;
  const tokenCap = new BN(500000000);

  before(async () => {
    accounts = await web3.eth.getAccounts();
    [, tokenOwner, whitelistOwner, influencer, brand] = accounts;
  });

  beforeEach(async () => {
    // PixelToken
    const tokenArgs = [tokenCap];
    tokenContract = await deployContract(web3, pixelTokenJson, tokenOwner, tokenArgs);
    tokenContractAddress = tokenContract.options.address;

    // Whitelist
    whitelistContact = await deployContract(web3, whitelistJson, whitelistOwner, []);
    whitelistAddress = whitelistContact.options.address;

    // Pixel Campaign
    const campaingArgs = [
      tokenContractAddress,
      whitelistAddress
    ];
    campaignContract = await deployContract(web3, pixelCampaignJson, brand, campaingArgs);
  });

  it('should be properly created', async () => {
    const name = await tokenContract.methods.name().call({from: tokenOwner});
    const symbol = await tokenContract.methods.symbol().call({from: tokenOwner});
    const cap = new BN(await tokenContract.methods.cap().call({from: tokenOwner}));
    const decimals = new BN(await tokenContract.methods.decimals().call({from: tokenOwner}));
    expect(name).to.equal('PixelToken');
    expect(symbol).to.equal('PXL');
    expect(cap).to.eq.BN(tokenCap);
    expect(decimals).to.eq.BN(18);
  });
});
