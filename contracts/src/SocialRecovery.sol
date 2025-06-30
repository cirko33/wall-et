// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SocialRecovery
 * @notice This contract allows for the recovery of tokens from a contract in case of a security incident.
 *         It uses a quorum-based voting system to determine if a recovery should be initiated.
 *         Only recovery addresses can vote for a recovery address, and the recovery process can only be initiated once.
 */
contract SocialRecovery is Ownable {
    address private immutable _owner;

    mapping(address => bool) public recoveryAddresses;
    uint256 public recoveryAddressCount;

    uint256 public quorum;
    bool public recovered;

    mapping(address => bool) public tokenMap;
    address[] public tokens;

    mapping(address => mapping(address => bool)) public addressToRecoverVotes;
    mapping(address => uint256) public addressToRecoverVotesCount;

    /**
     * @dev Modifier to restrict access to only recovery addresses.
     * Reverts if the caller is not a registered recovery address.
     */
    modifier onlyRecoveryAddress() {
        require(recoveryAddresses[msg.sender], "Not a recovery address");
        _;
    }

    /**
     * @dev Modifier to ensure the contract has not already been recovered.
     * Reverts if recovery has already occurred.
     */
    modifier notRecovered() {
        require(!recovered, "Already recovered");
        _;
    }

    /**
     * @dev Constructor sets the initial recovery addresses and quorum.
     * @param _recoveryAddresses Array of addresses allowed to initiate recovery.
     * @param _quorum Number of recovery addresses required to approve recovery.
     */
    constructor(
        address[] memory _recoveryAddresses,
        uint256 _quorum
    ) Ownable(msg.sender) {
        _owner = msg.sender;

        for (uint256 i = 0; i < _recoveryAddresses.length; i++) {
            recoveryAddresses[_recoveryAddresses[i]] = true;
            recoveryAddressCount++;
        }

        quorum = _quorum;
        recovered = false;
    }

    /**
     * @dev Adds a new recovery address. Only callable by the owner and if not recovered.
     * @param _recoveryAddress The address to add as a recovery address.
     */
    function addRecoveryAddress(
        address _recoveryAddress
    ) external onlyOwner notRecovered {
        if (!recoveryAddresses[_recoveryAddress]) {
            recoveryAddresses[_recoveryAddress] = true;
            recoveryAddressCount++;
        }
    }

    /**
     * @dev Removes a recovery address. Only callable by the owner and if not recovered.
     *      Ensures the quorum and at least one recovery address remain.
     * @param _recoveryAddress The address to remove from recovery addresses.
     */
    function removeRecoveryAddress(
        address _recoveryAddress
    ) external onlyOwner notRecovered {
        if (recoveryAddresses[_recoveryAddress]) {
            recoveryAddressCount--;

            require(recoveryAddressCount >= quorum, "Quorum not met");
            require(recoveryAddressCount > 0, "No recovery addresses");

            recoveryAddresses[_recoveryAddress] = false;
        }
    }

    /**
     * @dev Adds a new ERC20 token to the list of tokens eligible for recovery.
     * @param _token The address of the ERC20 token contract.
     */
    function addToken(address _token) external onlyOwner notRecovered {
        if (!tokenMap[_token]) {
            tokenMap[_token] = true;
            tokens.push(_token);
        }
    }

    /**
     * @dev Adds multiple ERC20 tokens to the list of tokens eligible for recovery.
     * @param _tokens Array of ERC20 token contract addresses.
     */
    function addTokens(
        address[] memory _tokens
    ) external onlyOwner notRecovered {
        for (uint256 i = 0; i < _tokens.length; i++) {
            if (!tokenMap[_tokens[i]]) {
                tokenMap[_tokens[i]] = true;
                tokens.push(_tokens[i]);
            }
        }
    }

    /**
     * @dev Sets the quorum required for recovery. Only callable by the owner and if not recovered.
     * @param _quorum The new quorum value.
     */
    function setQuorum(uint256 _quorum) external onlyOwner notRecovered {
        require(_quorum > 0, "Quorum must be greater than 0");
        require(
            _quorum <= recoveryAddressCount,
            "Quorum cannot be greater than the number of recovery addresses"
        );

        quorum = _quorum;
    }

    /**
     * @dev Initiates the recovery process to transfer tokens to a specified address.
     *      Requires enough recovery addresses to vote for the same address to meet the quorum.
     *      Only callable by recovery addresses and if not recovered.
     * @param _recoverTo The address to which tokens will be transferred upon successful recovery.
     */
    function recover(
        address _recoverTo
    ) external onlyRecoveryAddress notRecovered {
        require(_recoverTo != address(0), "Invalid recovery address");
        require(
            !addressToRecoverVotes[_recoverTo][msg.sender],
            "Already voted"
        );

        addressToRecoverVotes[_recoverTo][msg.sender] = true;
        addressToRecoverVotesCount[_recoverTo]++;

        if (addressToRecoverVotesCount[_recoverTo] < quorum) {
            return;
        }

        recovered = true;

        for (uint256 i = 0; i < tokens.length; i++) {
            address token = tokens[i];
            if (tokenMap[token]) {
                uint256 allowance = IERC20(token).allowance(
                    _owner,
                    address(this)
                );
                uint256 balance = IERC20(token).balanceOf(_owner);

                if (allowance > 0 && balance > 0) {
                    if (allowance > balance) {
                        IERC20(token).transferFrom(_owner, _recoverTo, balance);
                    } else {
                        IERC20(token).transferFrom(
                            _owner,
                            _recoverTo,
                            allowance
                        );
                    }
                }
            }
        }
    }
}
