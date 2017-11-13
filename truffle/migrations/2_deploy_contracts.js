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