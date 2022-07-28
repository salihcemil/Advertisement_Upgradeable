// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

struct pay {
    bool registered;
    uint256 balance;
}

struct bid {
    address sender;
    uint256 availableAmount;
}

contract Advertisement_V1 is Initializable, OwnableUpgradeable {
    uint256 public totalBalance;
    uint256 public bidCount;

    mapping(address => pay) public payAccounts; //pay account
    mapping(uint256 => bid) public bids;

    address public trustedService;
    string public name;

    event Deployed(bool);
    event Registered(bool);
    event BidDone(bool);
    event Settled(bool);
    event Withdraw(bool);

    modifier onlyRegistered() {
        require(
            payAccounts[msg.sender].registered == true,
            "Only registered users can call this function"
        );
        _;
    }

    modifier onlyTrustedService() {
        require(
            msg.sender == trustedService,
            "Only trusted service can call this function"
        );
        _;
    }

    function initialize(address _trustedService) public initializer {
        totalBalance = 0;
        bidCount = 0;
        trustedService = _trustedService;
        name = "Advertisement";
        __Ownable_init();
        emit Deployed(true);
    }

    function getName() public view returns (string memory) {
        return name;
    }

    function register() public {
        require(
            payAccounts[msg.sender].registered == false,
            "User already registered"
        );
        pay memory Pay = pay(true, 0);
        payAccounts[msg.sender] = Pay;
        emit Registered(true);
    }

    function Bid(uint256 _days, uint256 _amount) public payable onlyRegistered {
        require(msg.value == _days * _amount, "Amount is not correct");

        totalBalance += msg.value;
        payAccounts[msg.sender].balance += msg.value;

        bid memory _bid = bid(msg.sender, msg.value);
        bidCount++;
        bids[bidCount] = _bid;
        emit BidDone(true);
    }

    function settle(
        uint256 _id,
        address[] calldata _shareholders,
        uint256[] calldata _shareAmounts
    ) public onlyTrustedService {
        require(_shareholders.length > 0, "Shareholder list cannot be empty");
        require(_shareAmounts.length > 0, "Share Amount list cannot be empty");
        require(
            _shareAmounts.length == _shareholders.length,
            "Inconsistent lists"
        );

        for (uint8 i = 0; i < _shareholders.length; i++) {
            require(
                payAccounts[bids[_id].sender].balance > 0,
                "Advertiser has no balance"
            );
            require(_shareholders[i] != address(0), "Invalid shareholder");
            require(_shareAmounts[i] > 0, "Invalid share amount");
            require(
                payAccounts[_shareholders[i]].registered == true,
                "Shareholder is not registered"
            );

            payAccounts[_shareholders[i]].balance += _shareAmounts[i];
            payAccounts[bids[_id].sender].balance -= _shareAmounts[i];
            bids[_id].availableAmount -= _shareAmounts[i];
        }
        emit Settled(true);
    }

    function withdrawMoney(address _withdrawer) public onlyOwner {
        require(
            payAccounts[_withdrawer].balance > 0,
            "Not enough balance to withdraw"
        );
        address payable to = payable(_withdrawer);
        uint256 amount = payAccounts[_withdrawer].balance;
        payAccounts[_withdrawer].balance = 0;
        totalBalance -= amount;
        to.transfer(amount);
        emit Withdraw(true);
    }

    function getBalance(address _adr) public view onlyOwner returns (uint256) {
        return payAccounts[_adr].balance;
    }

    function getTotalBalance() public view onlyOwner returns (uint256) {
        return totalBalance;
    }

    function getBidsCount() public view onlyOwner returns (uint256) {
        return bidCount;
    }

    function isRegistered(address _address)
        public
        view
        onlyOwner
        returns (bool)
    {
        return payAccounts[_address].registered;
    }

    function getBid(uint256 _id) public view onlyOwner returns (bid memory) {
        return bids[_id];
    }
}
