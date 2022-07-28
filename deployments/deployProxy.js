const { ethers, upgrades } = require("hardhat");

async function main() {
    const[deployer] = await ethers.getSigners();
    const V1 = await ethers.getContractFactory("Advertisement_V1");
    console.log('deployer: '+deployer.address);
    const proxy = await upgrades.deployProxy(V1, [deployer.address]);
    await proxy.deployed();

    console.log(proxy.address);
}

main();