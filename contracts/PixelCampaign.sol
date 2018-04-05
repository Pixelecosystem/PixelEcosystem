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

    enum States { Unfunded, Funded, Accepted, InfluencerFundsReleased, Disapproved }
    States public currentState = States.Unfunded;

    address public verifier;
    CrowdfundableToken public token;
    Whitelist public whitelist;
    string public criteria;
    uint256 public deadline;
    uint256 public influencerTotalAllocation;
    uint256 public fanSingleAllocation;
    uint256 public verifierSingleAllocation;
    uint256 public fanCount;
    address public influencer = 0x0;
    uint256 public releasedFanCount = 0;

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

    modifier onlyWhitelisted(address _address) {
        require(whitelist.isWhitelisted(_address));
        _;
    }

    modifier onlyAtState(States _state) {
        require(currentState == _state);
        _;
    }

    modifier onlyAfterDeadline() {
        require(now > deadline);
        _;
    }

    modifier onlyVerifier() {
        require(msg.sender == verifier);
        _;
    }

    function enterState(States _newState) internal {
        if (_newState == States.Unfunded) {
            revert();
        }
        else if (_newState == States.Funded) {
            require(currentState == States.Unfunded);
        }
        else if (_newState == States.Accepted) {
            require(currentState == States.Funded);
        }
        else if (_newState == States.InfluencerFundsReleased) {
            require(currentState == States.Accepted);
        }
        else if (_newState == States.Disapproved) {
            require(currentState == States.Accepted || currentState == States.Funded);
        }
        currentState = _newState;
    }

    function getTotalFunding() internal view returns(uint256) {
        return influencerTotalAllocation.add(fanSingleAllocation.mul(fanCount)).add(verifierSingleAllocation.mul(fanCount));
    }

    function fund(uint256 _influencerTotalAllocation, uint256 _fanSingleAllocation, uint256 _verifierSingleAllocation, uint256 _fanCount) 
            onlyAtState(States.Unfunded) public {
        require(_influencerTotalAllocation > 0);

        influencerTotalAllocation = _influencerTotalAllocation;
        fanSingleAllocation = _fanSingleAllocation;
        verifierSingleAllocation = _verifierSingleAllocation;
        fanCount = _fanCount;
        require(token.transferFrom(msg.sender, this, getTotalFunding()));
        enterState(States.Funded);

        emit Funded(msg.sender);
    }

    function accept() public onlyAtState(States.Funded) onlyWhitelisted(msg.sender) {
        require(influencer == 0x0);

        influencer = msg.sender;
        enterState(States.Accepted);

        emit Accepted(msg.sender);
    }

    function disapprove() public onlyOwner onlyAfterDeadline {
        require(currentState == States.Funded || currentState == States.Accepted);

        require(token.transfer(owner, influencerTotalAllocation));
        enterState(States.Disapproved);

        emit Disapproved();
    }

    function releaseInfluencerFunds() public onlyOwner onlyAtState(States.Accepted) {
        require(token.transfer(influencer, influencerTotalAllocation));

        enterState(States.InfluencerFundsReleased);

        emit InfluencerFundsReleased();
    }

    function releaseFanFunds(address _fan) public onlyVerifier {
        require(releasedFanCount < fanCount);
        require(_fan != 0x0);

        releasedFanCount = releasedFanCount.add(1);
        require(token.transfer(_fan, fanSingleAllocation));
        require(token.transfer(verifier, verifierSingleAllocation));

        emit VerifierFundsReleased();
        emit FanFundsReleased(_fan);
    }
}
