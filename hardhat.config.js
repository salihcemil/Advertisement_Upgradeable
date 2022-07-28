require('dotenv').config();
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-etherscan');
require('@openzeppelin/hardhat-upgrades');
/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const privateKey = process.env.PRIVATE_KEY;
const endpointRinkeby = process.env.RINKEBY_URL;
const etherscanKey = process.env.ETHERSCAN_KEY;

module.exports = {
  solidity: {
    version: "0.8.4"
  },
  networks: {
    rinkeby: {
      url: endpointRinkeby,
      accounts: [`0x${privateKey}`]
    }
  },
  etherscan:{
    apiKey: etherscanKey
  }
};
