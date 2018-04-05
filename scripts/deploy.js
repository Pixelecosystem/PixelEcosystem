import {deployContract} from 'ethworks-solidity';
const Web3 = require('Web3');
const web3 = new Web3(new Web3.providers.HttpProvider(`http://localhost:7545`));
const contractJson = require('../build/contracts/PixelToken.json');

describe('Deploying', async() => {
  const args = [
    1000
  ];
  let owner;

  before(async () => {
    [owner] = await web3.eth.getAccounts();
  });

  it('Deploying pixel token', async() => {
    const contract = await deployContract(web3, contractJson, owner, args);
    console.log(`Deployed at: ${contract.options.address}`);
  });
});
