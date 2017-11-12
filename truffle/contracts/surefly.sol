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
    // Probability * 1.1 * 100

    // Events?


    function surefly() public {
        userCount = 0;
    }
    //External
    function addUser(uint256 _maxPayout, uint _minPayout, uint256 _initialPremium, uint256 _prob)public returns(bool success) {
        idOf[msg.sender]=userCount;
        users[userCount].adr = msg.sender;
        users[userCount].maxPayout = _maxPayout;
        users[userCount].minPayout = _minPayout;
        users[userCount].poolSize = 0;
        users[userCount].initialPremium = _initialPremium;
        users[userCount].finalPremium = _initialPremium;
        users[userCount].prob = _prob;
        users[userCount].status = policyStatus.OPEN;
        users[userCount].departed = false;
        users[userCount].boarded = false;
        users[userCount].investorCount = 0;
        // users[userCount].flightCancelled = false;
        // users[userCount].ticketCancelled = false;
        userCount++;
        return true;
    }
    //Internal
    function isMaxPayoutReached(uint id) internal returns (bool) {
        if(users[id].poolSize == users[id].maxPayout){
            return true;
        }
        else 
        return false;
    }
    //Internal
    function isMinPayoutReached(uint id) internal returns (bool) {
        if(users[id].poolSize >= users[id].minPayout){
            return true;
        }
        else 
        return false;
    }
    //Internal
    function hasFlightDeparted(uint id) internal returns (bool) {
        if(users[id].departed){
            return true;
        }
        else 
        return false;
    }
    //Internal
    function hasUserBoarded(uint id) internal returns (bool) {
        if(users[id].boarded){
            return true;
        }
        else 
        return false;
    }
    //External
    function queryPoolSize(address adr) public constant returns (uint256) {
        return users[idOf[adr]].poolSize;
    }
    //External
    function listAllAvailablePolicies() public constant returns (address[]) { 
        address[] storage openUsers;
        for (uint i=0; i<=userCount; i++){
            if (users[i].status == policyStatus.OPEN) {
               openUsers.push(users[i].adr); 
            }
        } 
        return openUsers;
    }
    // TODO: What to return?
    //External
    function flightDeparted(address adr) public returns (bool) {
        users[idOf[adr]].departed = true;
        if(userBoarded(adr) == false){
          users[idOf[adr]].status = policyStatus.MISSED;  
        }
        else
        {
            users[idOf[adr]].status = policyStatus.NOTMISSED;
        }
        payout(idOf[adr]);
    }
    //External
    function userBoarded(address adr) public returns (bool) {
        users[idOf[adr]].boarded = true;
        return true;
    }
    //External
    function cancelPolicy(address adr) public returns (bool){
        users[idOf[adr]].status = policyStatus.TICKETCANCELLED;
        payout(idOf[adr]);
        return true;
    }
    //External
    function cancelFlight(address adr) public {
        users[idOf[adr]].status = policyStatus.CANCELLED;
        payout(idOf[adr]);
    }
    function isMinRaised(uint id) internal returns (bool){
        if(users[id].poolSize >= users[id].minPayout)
        return true;
        else
        return false;
    }

    function invest(address adr, uint256 amount) public returns (bool) {
        require(!isMaxPayoutReached(idOf[adr]));
        //require(isMinPayoutReached(idOf[adr]));
        require(users[idOf[adr]].status == policyStatus.OPEN);
        require(!hasFlightDeparted(idOf[adr]));
        require(!hasUserBoarded(idOf[adr]));
        users[idOf[adr]].investedAmountOf[msg.sender] = amount;
        users[idOf[adr]].investorAdrOf[investorCount] = msg.sender;
        users[idOf[adr]].investorCount++;
        users[idOf[adr]].poolSize += amount;
        return true;
    }
    //if missed? if not? ()s
    //Internal
    function payout(uint id) internal returns (bool){
        
    require(users[id].status!= policyStatus.OPEN);

        if(isMinRaised(id)) {
            users[id].status = policyStatus.CANCELLED;
        }
       users[id].finalPremium = (users[id].prob * users[id].poolSize) / 100;
       uint256 transferEtherAmount;
       address adr;
       uint i;
       if(users[id].status == policyStatus.MISSED)
        {
            transferEther(address(this), users[id].adr, users[id].poolSize);
            for( i=0; i<users[id].investorCount ; i++){
                 adr = users[id].investorAdrOf[i];
                 transferEtherAmount = users[id].investedAmountOf[adr] - (((users[id].finalPremium)*(users[id].investedAmountOf[adr]))/users[id].poolSize);
                transferEther(address(this), adr, transferEtherAmount);
            }
        }
        if(users[idOf[adr]].status == policyStatus.NOTMISSED)
        {
            //transferEther(address(this), users[id].adr, users[id].poolSize);
            for(i=0; i<users[id].investorCount ; i++){
                 adr = users[id].investorAdrOf[i];
               transferEtherAmount = users[id].investedAmountOf[adr] + (((users[id].finalPremium)*(users[id].investedAmountOf[adr]))/users[id].poolSize);
                transferEther(address(this), adr, transferEtherAmount);
            }
        }

        if(users[idOf[adr]].status == policyStatus.CANCELLED)
        {
            transferEther(address(this), users[id].adr, users[id].initialPremium);
            for( i=0; i<users[id].investorCount ; i++){
                 adr = users[id].investorAdrOf[i];
                transferEtherAmount = users[id].investedAmountOf[adr];
                transferEther(address(this), adr, transferEtherAmount);
            }
        }
        if(users[idOf[adr]].status == policyStatus.TICKETCANCELLED)
        {
            for( i=0; i<users[id].investorCount ; i++){
                 adr = users[id].investorAdrOf[i];
                transferEtherAmount = users[id].investedAmountOf[adr] + users[id].finalPremium*users[id].investedAmountOf[adr]/users[id].poolSize;
                transferEther(address(this), adr, transferEtherAmount);
            }
        }
        return true;
    }
    //Internal
    function transferEther(address sender, address reciever, uint256 amount) internal {
        reciever.transfer(amount);
    }

}