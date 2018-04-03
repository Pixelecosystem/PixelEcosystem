pragma solidity ^0.4.19;
import "ethworks-solidity/contracts/CrowdfundableToken.sol";

contract PixelToken is CrowdfundableToken {
    function PixelToken(uint256 _cap) public CrowdfundableToken(_cap, "PixelToken", "PXL", 18) {
    }
}

