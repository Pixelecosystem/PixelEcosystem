import {deployContract} from 'ethworks-solidity';
const Web3 = require('Web3');
const web3 = new Web3(new Web3.providers.HttpProvider(`http://localhost:8545`));
const tokenJson = require('../build/contracts/PixelToken.json');
const whitelistJson = require('../build/contracts/Whitelist.json');
const campaignJson = require('../build/contracts/PixelCampaign.json');

describe('Deploying', async() => {
  const tokenCap = 1000;
  const tokenArgs = [
    tokenCap
  ];
  let owner;
  let tokenContract;
  let tokenAddress;
  let whitelistContract;
  let whitelistAddress;

  before(async () => {
    [owner] = await web3.eth.getAccounts();

    // token
    tokenContract = await deployContract(web3, tokenJson, owner, tokenArgs);
    tokenAddress = tokenContract.options.address;
    console.log(`Deployed pixel token at: ${tokenAddress}`);

    // whitelist
    whitelistContract = await deployContract(web3, whitelistJson, owner, []);
    whitelistAddress = whitelistContract.options.address;
    console.log(`Deployed whitelist at: ${whitelistAddress}`);

    // token minting
    await tokenContract.methods.mint(owner, tokenCap).send({from: owner});
    await tokenContract.methods.finishMinting().send({from: owner});
    console.log('PixelToken: Finished minting');
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
