pragma solidity ^0.4.19;
import "ethworks-solidity/contracts/CrowdfundableToken.sol";

contract Pixelcoin is CrowdfundableToken {
    function Pixelcoin(uint256 _cap) public CrowdfundableToken(_cap, "Pixelcoin", "PXL", 18) {
    }
}

