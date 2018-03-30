import {createWeb3, deployContract, expectThrow} from '../testUtils.js';
import pixelTokenJson from '../../build/contracts/PixelToken.json';
import chai from 'chai';
import bnChai from 'bn-chai';

const {expect} = chai;
const web3 = createWeb3();
chai.use(bnChai(web3.utils.BN));

describe('PixelToken', () => {
  const web3 = createWeb3();
  const {BN} = web3.utils;
  let tokenOwner;
  let tokenContract;
  let tokenContractAddress;
  let accounts;
  const tokenCap = new BN(500000000);

  before(async () => {
    accounts = await web3.eth.getAccounts();
    [tokenOwner] = accounts;
  });

  beforeEach(async () => {
    tokenContract = await deployContract(web3, pixelTokenJson, tokenOwner,
      [tokenCap]);
    tokenContractAddress = tokenContract.options.address;
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
