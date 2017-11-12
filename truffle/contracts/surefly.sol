pragma solidity ^0.4.17;

contract surefly{
    enum policyStatus {OPEN, MISSED, NOTMISSED, FLIGHTCANCELLED, TICKETCANCELLED}
    struct user{
        address adr;
        uint256 maxPayout;
        uint256 minPayout;
        uint256 poolSize;
        uint256 initialPremium;
        uint256 finalPremium;
        policyStatus status;
        mapping (address => uint) investedAmountOf;
        boolean departed;
        boolean boarded;
        boolean flightCancelled;
        boolean ticketCancelled;

    }
    mapping(address => uint) idOf;
    mapping (uint => user) users;
    uint256 public userCount;
    //event() Pool Filled?

    function surefly(){
        userCount = 0;
    }
    function addUser(uint256 _maxPayout, uint _minPayout, uint256 _initialPremium)public returns(bool success){
        idOf[msg.sender]=userCount;
        users[userCount].adr = msg.sender;
        users[userCount].maxPayout = _maxPayout;
        users[userCount].minPayout = _minPayout;
        users[userCount].poolSize = 0;
        users[userCount].intialPremium = _initialPremium;
        users[userCount].finalPremium = _initialPremium;
        users[userCount].status = OPEN;
        users[userCount].departed = false;
        users[userCount].boarded = false;
        // users[userCount].flightCancelled = false;
        // users[userCount].ticketCancelled = false;
        userCount++;
        return true;
    }
    function isMaxPayoutReached(uint id) internal returns (bool){
        if(users[id].poolSize == users[idOf[_adr]].maxPayout){
            return true;
        }
        else 
        return false;
    }
    function isMinPayoutReached(uint id) internal returns (bool){
        if(users[id].poolSize >= users[idOf[_adr]].minPayout){
            return true;
        }
        else 
        return false;
    }
    function hasFlightDeparted(uint id) internal returns (bool){
        if(users[id].departed){
            return true;
        }
        else 
        return false;
    }
    function hasUserBoarded(uint id) internal returns (bool){
        if(users[id].boarded){
            return true;
        }
        else 
        return false;
    }
    function queryPoolSize(address adr) public returns (uint256) {
        return users[idOf[adr]].poolSize;
    }
    function listAllAvailablePolicies() public returns (address[]){ 
        int i=0;
        address[] openUsers;
        for (i=0; i<=userCount; i++){
            if(users[i].status == OPEN)
            {
               openUsers.push(users[i].adr); 
            }
        } 
        return openUsers;
    }


}