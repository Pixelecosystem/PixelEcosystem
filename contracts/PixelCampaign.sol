pragma solidity ^0.4.19;
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "ethworks-solidity/contracts/CrowdfundableToken.sol";
import "ethworks-solidity/contracts/Whitelist.sol";

contract PixelCampaign is Ownable {
    using SafeMath for uint256;

    event Funded(address _funder);
    event Accepted(address _influencer);
    event InfluencerFundsReleased();
    event FanFundsReleased(address _fan);
    event VerifierFundsReleased();
    event Disapproved();

    address public verifier;
    CrowdfundableToken public token;
    Whitelist public whitelist;
    string public criteria;
    uint256 public deadline;
    uint256 public influencerTotalAllocation;
    uint256 public fanSingleAllocation;
    uint256 public verifierSingleAllocation;
    uint256 public fanCount;
    bool public isFunded = false;
    address public influencer = 0x0;
    bool public influencerFundsReleased = false;
    bool public disapproved = false;
    uint256 releasedFanCount = 0;

    function PixelCampaign(CrowdfundableToken _token, Whitelist _whitelist, string _criteria, uint256 _deadline, address _verifier) public {
        require(address(_token) != 0x0);
        require(address(_whitelist) != 0x0);
        require(bytes(_criteria).length > 0);
        require(_deadline > now);
        require(_verifier != 0x0);

        token = _token;
        whitelist = _whitelist;
        criteria = _criteria;
        deadline = _deadline;
        verifier = _verifier;
    }

    modifier funded() {
        require(isFunded);
        _;
    }

    modifier accepted() {
        require(influencer != 0x0);
        _;
    }

    modifier afterDeadline() {
        require(now > deadline);
        _;
    }

    function getTotalFunding() internal returns(uint256) {
        return influencerTotalAllocation.add(fanSingleAllocation.mul(fanCount)).add(verifierSingleAllocation.mul(fanCount));
    }

    function fund(uint256 _influencerTotalAllocation, uint256 _fanSingleAllocation, uint256 _verifierSingleAllocation, uint256 _fanCount) public {
        require(!isFunded);
        require(_influencerTotalAllocation > 0);

        influencerTotalAllocation = _influencerTotalAllocation;
        fanSingleAllocation = _fanSingleAllocation;
        verifierSingleAllocation = _verifierSingleAllocation;
        fanCount = _fanCount;

        require(token.transferFrom(msg.sender, this, getTotalFunding()));
        isFunded = true;
        Funded(msg.sender);
    }

    function accept() public funded {
        require(influencer == 0x0);
        require(!disapproved);
        require(whitelist.isWhitelisted(msg.sender));
        influencer = msg.sender;
        Accepted(msg.sender);
    }

    function disapprove() public onlyOwner afterDeadline {
        require(!disapproved && !influencerFundsReleased);
        require(token.transfer(msg.sender, influencerTotalAllocation));
        disapproved = true;
        Disapproved();
    }

    function releaseInfluencerFunds() public onlyOwner accepted {
        require(!disapproved && !influencerFundsReleased);
        require(token.transfer(influencer, influencerTotalAllocation));
        influencerFundsReleased = true;
        Disapproved();
    }
}
