var Migrations = artifacts.require("./Migrations.sol");
var sureFly = artifacts.require("./surefly.sol");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(surefly);
};
