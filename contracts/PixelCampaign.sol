pragma solidity ^0.4.19;
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "ethworks-solidity/contracts/IcoToken.sol";
import "ethworks-solidity/contracts/Whitelist.sol";

contract PixelCampaign is Ownable {
    using SafeMath for uint256;

    IcoToken token;
    Whitelist whitelist;
    string criteria;

    function PixelCampaign(IcoToken _token, Whitelist _whitelist) public {
        require(address(_token) != 0x0);
        require(address(_whitelist) != 0x0);

        token = _token;
        whitelist = _whitelist;
    }
}
