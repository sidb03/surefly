var Token = artifacts.require("./surefly.sol");

var debug = true;
var showABI = false;
var showURL = false;

module.exports = function(deployer, network, accounts) {

    /**
     * 
     * ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
     * Parameters Section Starts
     * ===================================
     * 
     */

    /**
     * Token Parameters 
     * =====================================
     * Here you can chose your token name, symbol, initial supply & decimals etc.
     */

    
    var _listOfOwners;
    if (network == "testrpc") {
        _listOfOwners = [accounts[1], accounts[2], accounts[3]];
    } else if (network == "ropsten") {
        var aliceRopsten = "0x00568Fa85228C66111E3181085df48681273cD77";
        var bobRopsten = "0x00B600dE56F7570AEE3d57fe55E0462e51ca5280";
        var eveRopsten = "0x00F131eD217EC029732235A96EEEe044555CEd4d";
        _listOfOwners = [aliceRopsten, bobRopsten, eveRopsten];
    } else if (network == "mainnet") {
        // you have to manually specify this 
        // before you deploy this in mainnet
        // or else this deployment will fail
        var member1 = "0x00";
        var member2 = "0x00";
        var member3 = "0x00";
        _listOfOwners = [member1, member2, member3];
        if (member1 == "0x00" || member2 == "0x00" || member3 == "0x00") {
            throw new Error("MultiSigWallet members are not set properly. Please set them in migration/2_deploy_contracts.js.");
        }
    }

    /**
     * 
     * ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
     * Parameters Section Ends
     * ===================================
     * 
     */

    var tokenInstance;
    

    deployer.then(function() {
        //if (debug) console.log("*************  Deploying SureFly Contract  ************** \n");
        return Token.new();

    }).then(function(Instance) {
        //console.log(Instance);
        tokenInstance = Instance;
        if (debug) console.log("SureFly Parameters are:");
        if (debug) console.log("Deployed Successfully");
        if (debug) console.log("SureFly address is: ", tokenInstance.address);
        if (showURL) console.log("Token URL is: " + getEtherScanUrl(network, tokenInstance.address, "token"));
        if (showURL) console.log("Transaction URL is: " + getEtherScanUrl(network, tokenInstance.transactionHash, "tx"));
        if (showABI) console.log("DayToken ABI is: ", JSON.stringify(tokenInstance.abi));
        if (debug) console.log("===============================================");
        if (debug) console.log("\n\n");
        
        return MultiSigWallet.new(_listOfOwners, _minRequired);
    });

    function getEtherScanUrl(network, data, type) {
        var etherscanUrl;
        if (network == "ropsten" || network == "kovan") {
            etherscanUrl = "https://" + network + ".etherscan.io";
        } else {
            etherscanUrl = "https://etherscan.io";
        }
        if (type == "tx") {
            etherscanUrl += "/tx";
        } else if (type == "token") {
            etherscanUrl += "/token";
        } else if (type == "address") {
            etherscanUrl += "/address";
        }
        etherscanUrl = etherscanUrl + "/" + data;
        return etherscanUrl;
    }

    function etherInWei(x) {
        return web3.toBigNumber(web3.toWei(x, 'ether')).toNumber();
    }


    function tokenPriceInWeiFromTokensPerEther(x) {
        if (x == 0) return 0;
        return Math.floor(web3.toWei(1, 'ether') / x);
    }

    function getUnixTimestamp(timestamp) {
        var startTimestamp = new Date(timestamp);
        return startTimestamp.getTime() / 1000;
    }


    function tokenInSmallestUnit(tokens, _tokenDecimals) {
        return tokens * Math.pow(10, _tokenDecimals);
    }
}