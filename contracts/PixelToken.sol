pragma solidity ^0.4.19;
import "ethworks-solidity/contracts/IcoToken.sol";

contract PixelToken is IcoToken {
    function PixelToken(uint256 _cap) public IcoToken(_cap, "PixelToken", "PXL", 18) {
    }
}

