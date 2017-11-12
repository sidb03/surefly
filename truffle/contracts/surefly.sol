pragma solidity ^0.4.17;

contract surefly{
    enum policyStatus {OPEN, MISSED, NOTMISSED, CANCELLED, TICKETCANCELLED}
    struct user{
        address adr;
        uint256 maxPayout;
        uint256 minPayout;
        uint256 poolSize;
        uint256 initialPremium;
        uint256 prob;
        uint256 finalPremium;
        policyStatus status;
        mapping (address => uint) investedAmountOf;
        mapping(uint => address) investorAdrOf;
        bool departed;
        bool boarded;
        bool flightCancelled;
        bool ticketCancelled;
        uint256 investorCount;
    }
    mapping(address => uint) idOf;
    mapping (uint => user) users;
    uint256 public userCount;
    uint256 public investorCount;
    //event() Pool Filled?


    // Events?


    function surefly() {
        userCount = 0;
    }
    //External
    function addUser(uint256 _maxPayout, uint _minPayout, uint256 _initialPremium, uint256 _prob)public returns(bool success) {
        idOf[msg.sender]=userCount;
        users[userCount].adr = msg.sender;
        users[userCount].maxPayout = _maxPayout;
        users[userCount].minPayout = _minPayout;
        users[userCount].poolSize = 0;
        users[userCount].intialPremium = _initialPremium;
        users[userCount].finalPremium = _initialPremium;
        users[userCount].prob = _prob;
        users[userCount].status = OPEN;
        users[userCount].departed = false;
        users[userCount].boarded = false;
        users[userCount].investorCount = 0;
        // users[userCount].flightCancelled = false;
        // users[userCount].ticketCancelled = false;
        userCount++;
        return true;
    }
    //Internal
    function isMaxPayoutReached(uint id) internal returns (bool){
        if(users[id].poolSize == users[idOf[_adr]].maxPayout){
            return true;
        }
        else 
        return false;
    }
    //Internal
    function isMinPayoutReached(uint id) internal returns (bool){
        if(users[id].poolSize >= users[idOf[_adr]].minPayout){
            return true;
        }
        else 
        return false;
    }
    //Internal
    function hasFlightDeparted(uint id) internal returns (bool){
        if(users[id].departed){
            return true;
        }
        else 
        return false;
    }
    //Internal
    function hasUserBoarded(uint id) internal returns (bool){
        if(users[id].boarded){
            return true;
        }
        else 
        return false;
    }
    //External
    function queryPoolSize(address adr) public returns (uint256) {
        return users[idOf[adr]].poolSize;
    }
    //External
    function listAllAvailablePolicies() public returns (address[]) { 
        uint i=0;
        address[] openUsers;
        hfor (i=0; i<=userCount; i++){
            if (users[i].status == OPEN) {
               openUsers.push(users[i].adr); 
            }
        } 
        return openUsers;
    }
    // TODO: What to return?
    //External
    function flightDeparted(address adr) returns (bool) {
        users[id].departed = true;
        if(userBoarded(id) == false){
          users[id].status = MISSED;  
        }
        else
        {
            users[id].status = NOTMISSED;
        }
        payout(idOf[adr]);
    }
    //External
    function userBoarded(address adr) returns (bool) {
        users[id].boarded = true;
    }
    //External
    function cancelPolicy(address adr) {
        users[idOf[adr]].status = TICKETCANCELLED;
        payout(idOf[adr]);
    }
    //External
    function cancelFlight(address adr) {
        users[idOf[adr]].status = CANCELLED;
        payout(idOf[adr]);
    }
    function isMinRaised(uint id) internal returns (bool){
        if(users[id].poolSize >= users[id].minPayout)
        return true;
        else
        return false;
    }

    function invest(address adr, uint256 amount) {
        require(!isMaxPayoutReached(idOf[adr]));
        //require(isMinPayoutReached(idOf[adr]));
        require(users[idOf[adr]].status == OPEN);
        require(!hasFlightDeparted(idOf[adr]));
        require(!hasUserBoarded(idOf[adr]));
        users[idOf[adr]].investedAmountOf[msg.sender] = amount;
        users[idOf[adr]].investorAdrOf[investorCount] = msg.sender;
        users[idOf[adr]].investorCount++;
        users[idOf[adr]].poolSize += amount;
    }
    //if missed? if not? ()s
    //Internal
    function payout(uint id) internal {
        
    require(users[id].status!=OPEN);

        if(isMinRaised(id){
            users[id].status = CANCELLED;
        }
 --------       users[id].finalPremium = (users[id].prob * users[id].poolSize * 110) / 100;
       if(users[id].status == MISSED)
        {
            transferEther(address(this), users[id].adr, users[id].poolSize);
            for(int i=0; i<users[id].investorCount ; i++){
                address adr = users[id].investorAdrOf[i];
  -------         uint256 transferEtherAmount = users[id].investedAmountOf[adr] - users[id].finalPremium*users[id].investedAmountOf[adr]/users[id].poolSize;
                transferEther(address(this), adr, transferEtherAmount);
            }
        }
        if(users[idOf[adr]].status == NOTMISSED)
        {
            //transferEther(address(this), users[id].adr, users[id].poolSize);
            for(int i=0; i<users[id].investorCount ; i++){
                address adr = users[id].investorAdrOf[i];
 ------               uint256 transferEtherAmount = users[id].investedAmountOf[adr] + users[id].finalPremium*users[id].investedAmountOf[adr]/users[id].poolSize;
                transferEther(address(this), adr, transferEtherAmount);
            }
        }

        if(users[idOf[adr]].status == CANCELLED)
        {
            transferEther(address(this), users[id].adr, users[id].initialPremium);
            for(int i=0; i<users[id].investorCount ; i++){
                address adr = users[id].investorAdrOf[i];
                uint256 transferEtherAmount = users[id].investedAmountOf[adr];
                transferEther(address(this), adr, transferEtherAmount);
            }
        }
        if(users[idOf[adr]].status == TICKETCANCELLED)
        {
            for(int i=0; i<users[id].investorCount ; i++){
                address adr = users[id].investorAdrOf[i];
                uint256 transferEtherAmount = users[id].investedAmountOf[adr] + users[id].finalPremium*users[id].investedAmountOf[adr]/users[id].poolSize;
                transferEther(address(this), adr, transferEtherAmount);
            }
        }
    }
    //Internal
    function transferEther(address sender, address reciever, uint256 amount) internal {
        sender.transfer(reciever, amount);
    }

}