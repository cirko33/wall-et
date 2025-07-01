// SPDX-License-Identifier: MIT
pragma solidity >=0.8.2 <0.9.0;

interface ISocialRecovery {
    function addRecoveryAddress(address _recoveryAddress) external;

    function removeRecoveryAddress(address _recoveryAddress) external;

    function addToken(address _token) external;

    function addTokens(address[] memory _tokens) external;

    function setQuorum(uint256 _quorum) external;

    function recover(address _recoverTo) external;
}
