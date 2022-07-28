const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BigNumber } = require('ethers');

describe('Advertisement_V1', () => {
    let [owner, user1, user2, user3] = [];
    let Contract;
    let contract_V1;

    beforeEach(async () => {
        [owner, user1, user2, user3] = await ethers.getSigners();
        Contract = await ethers.getContractFactory("Advertisement_V1");
        contract_V1= await Contract.deploy();
        await contract_V1.initialize(owner.address);
    });

    it('Should be deployed correctly', async function () {
        const name = await contract_V1.getName();
        expect(name).to.equal('Advertisement');
    });

    it("Emits event on register", async () => {
        await expect(contract_V1.register())
          .to.emit(contract_V1, "Registered")
          .withArgs(true)
    })

    it("Rerverts on re-register", async () => {
        await contract_V1.register();
        await expect(contract_V1.register()).to.be.revertedWith(
            "User already registered"
          )
    })

    it("Reverts for onlyOwner", async () => {
        await contract_V1.register();
        await expect(contract_V1.connect(user1).isRegistered(owner.address)).to.be.revertedWith('Ownable: caller is not the owner');
    })

    it("Registers the pay account", async () => {
        await contract_V1.register();
        var result = await contract_V1.isRegistered(owner.address);
        expect(result).to.be.true;
    })

    it("Succesfully bids", async () => {
        await contract_V1.register();
        //await contract_V1.connect(user1).register();
        await expect(contract_V1.Bid(3, ethers.utils.parseEther("1"), {
                value: ethers.utils.parseEther("3")
            })).to.emit(contract_V1, "BidDone")
                .withArgs(true);
    })

    it("Reverts getBids with unregistered account", async () => {
        await contract_V1.register();
        await expect(contract_V1.connect(user1).Bid(3, ethers.utils.parseEther("1"), {
                value: ethers.utils.parseEther("3")
            })).to.be.revertedWith('Only registered users can call this function');
    })

    it("Reverts with incorrect amount", async () => {
        await contract_V1.connect(user1).register();
        await expect(contract_V1.connect(user1).Bid(3, ethers.utils.parseEther("1"), {
                value: ethers.utils.parseEther("5")
            })).to.be.revertedWith('Amount is not correct');
    })

    it("Successsfuly gets the bid", async () => {
        await contract_V1.connect(user1).register();
        await contract_V1.connect(user1).Bid(3, ethers.utils.parseEther("1"), {
            value: ethers.utils.parseEther("3")
            });

        var result = await contract_V1.getBid(1);
        expect(result.sender).equal(user1.address);
    })

    it("Successsfuly settles", async () => {
        await contract_V1.connect(user1).register();
        await contract_V1.connect(user2).register();
        await contract_V1.connect(user3).register();
        await contract_V1.connect(user1).Bid(3, ethers.utils.parseEther("1"), {
            value: ethers.utils.parseEther("3")
            });

        await expect(contract_V1.settle(1,[user2.address, user3.address], ["1000000000000000000","2000000000000000000"])).to.emit(contract_V1, "Settled")
        .withArgs(true);
    })

    it("Reverts settle with unregistered shareholder", async () => {
        await contract_V1.connect(user1).register();
        await contract_V1.connect(user1).Bid(3, ethers.utils.parseEther("1"), {
            value: ethers.utils.parseEther("3")
            });

        await expect(contract_V1.settle(1,[user2.address, user3.address], ["1000000000000000000","2000000000000000000"])).to.be.revertedWith("Shareholder is not registered");
    })

    it("Reverts settle with invalid shareholder", async () => {
        await contract_V1.connect(user1).register();
        await contract_V1.connect(user1).Bid(3, ethers.utils.parseEther("1"), {
            value: ethers.utils.parseEther("3")
            });

        await expect(contract_V1.settle(1,["0x0000000000000000000000000000000000000000", user3.address], ["1000000000000000000","2000000000000000000"])).to.be.revertedWith("Invalid shareholder");
    })

    it("Reverts settle with untrusted service", async () => {
        await contract_V1.connect(user1).register();
        await contract_V1.connect(user2).register();
        await contract_V1.connect(user3).register();
        await contract_V1.connect(user1).Bid(3, ethers.utils.parseEther("1"), {
            value: ethers.utils.parseEther("3")
            });

        await expect(contract_V1.connect(user2).settle(1,[user1.address, user3.address], ["1000000000000000000","2000000000000000000"])).to.be.revertedWith("Only trusted service can call this function");
    })

    it("Successsfuly withdraws", async () => {
        await contract_V1.connect(user1).register();
        await contract_V1.connect(user2).register();
        await contract_V1.connect(user3).register();
        await contract_V1.connect(user1).Bid(3, ethers.utils.parseEther("1"), {
            value: ethers.utils.parseEther("3")
            });

        await contract_V1.settle(1,[user2.address, user3.address], ["1000000000000000000","2000000000000000000"]);

        await contract_V1.withdrawMoney(user2.address);
        var totalBalance = BigNumber.from(await contract_V1.getTotalBalance());

        await expect(totalBalance._hex).to.be.equal("0x1bc16d674ec80000");
    })

    it("Recerts withdraw for onlyOwner ", async () => {
        await contract_V1.connect(user1).register();
        await contract_V1.connect(user2).register();
        await contract_V1.connect(user3).register();
        await contract_V1.connect(user1).Bid(3, ethers.utils.parseEther("1"), {
            value: ethers.utils.parseEther("3")
            });

        await contract_V1.settle(1,[user2.address, user3.address], ["1000000000000000000","2000000000000000000"]);

        await expect(contract_V1.connect(user3).withdrawMoney(user2.address)).to.be.revertedWith('Ownable: caller is not the owner') ;
    })
});