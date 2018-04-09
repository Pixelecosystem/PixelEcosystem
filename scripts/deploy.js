import {deployContract} from 'ethworks-solidity';
const Web3 = require('Web3');
const web3 = new Web3(new Web3.providers.HttpProvider(`http://localhost:8545`));
const tokenJson = require('../build/contracts/PixelToken.json');
const whitelistJson = require('../build/contracts/Whitelist.json');
const campaignJson = require('../build/contracts/PixelCampaign.json');

describe('Deploying', async() => {
  const tokenArgs = [
    1000 // token cap
  ];
  let owner;
  let tokenAddress;
  let whitelistAddress;

  before(async () => {
    [owner] = await web3.eth.getAccounts();
  });

  it('Deploying pixel token', async() => {
    const contract = await deployContract(web3, tokenJson, owner, tokenArgs);
    tokenAddress = contract.options.address;
    console.log(`Deployed pixel token at: ${tokenAddress}`);
  });

  it('Deploying whtelist', async() => {
    const contract = await deployContract(web3, whitelistJson, owner, []);
    whitelistAddress = contract.options.address;
    console.log(`Deployed whitelist at: ${whitelistAddress}`);
  });

  it('Deploying pixel campaign', async() => {
    const timestamp = Math.round((new Date()).getTime() / 1000);
    const campaignArgs = [
      tokenAddress,
      whitelistAddress,
      '<soft criteria>',
      timestamp + (60 * 60), // deadline
      owner, // verifier
      1000, // influencerTotalAllocation
      0, // fanSingleAllocation
      0, // verifierSingleAllocation
      0 // fanCount
    ];
    const contract = await deployContract(web3, campaignJson, owner, campaignArgs);
    console.log(`Deployed pixel campaign at: ${contract.options.address}`);
  });
});
