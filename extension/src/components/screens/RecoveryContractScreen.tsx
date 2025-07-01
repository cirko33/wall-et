import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useRecoveryContract } from "../providers/RecoveryContractProvider";
import { useWallet } from "../providers/WalletProvider";
import { getAddressBook } from "../../utils/addressBookStorage";
import { getTokenAddressBook } from "../../utils/tokenAddressBookStorage";

const RECOVERY_CONTRACT_KEY = "recovery-contract";

const RecoveryContractScreen: React.FC<{
  setProviderContractAddress: (address: string) => void;
  onRecoveryContractDeploymentSuccess?: (deploymentData: {
    contractAddress: string;
    recoveryAddresses: string[];
    quorum: number;
    deployerAddress: string;
    chainId: number;
    timestamp: number;
  }) => void;
  onRecoveryContractActionSuccess?: (actionData: {
    actionType: "deploy" | "addRecoveryAddress" | "removeRecoveryAddress" | "setQuorum" | "recover" | "tokenApproval";
    txHash: string;
    contractAddress: string;
    actionDetails: {
      address?: string;
      quorum?: number;
      recoverTo?: string;
      tokens?: string[];
    };
    signerAddress: string;
    chainId: number;
    timestamp: number;
  }) => void;
}> = ({ 
  setProviderContractAddress, 
  onRecoveryContractDeploymentSuccess,
  onRecoveryContractActionSuccess 
}) => {
  // Wallet and contract context
  const { address: walletAddress } = useWallet();
  const {
    contract,
    isLoading,
    error,
    deploy,
    addRecoveryAddress,
    removeRecoveryAddress,
    setQuorum,
    owner,
    quorum: getQuorum,
    recoveryAddresses,
    recoveryAddressCount,
    recover,
    handleAllTokensApproval,
  } = useRecoveryContract();

  // State for contract address
  const [contractAddress, setContractAddress] = useState<string>("");
  // State for deploy form
  const [addresses, setAddresses] = useState<string[]>([walletAddress || ""]);
  const [addressErrors, setAddressErrors] = useState<string[]>([""]);
  const [quorum, setQuorumInput] = useState<number>(1);
  const [deployError, setDeployError] = useState<string>("");
  const [deployLoading, setDeployLoading] = useState(false);
  // State for contract info
  const [isOwner, setIsOwner] = useState(false);
  const [currentQuorum, setCurrentQuorum] = useState<number | null>(null);
  const [recoveryList, setRecoveryList] = useState<string[]>([]);
  // State for address book (for selection convenience only)
  const [addressBook, setAddressBook] = useState<
    { address: string; name: string }[]
  >([]);
  // State for recovery actions
  const [selectedRecoveryAddress, setSelectedRecoveryAddress] =
    useState<string>("");
  const [recoveryActionLoading, setRecoveryActionLoading] = useState(false);
  const [recoveryActionError, setRecoveryActionError] = useState("");
  const [recoverTo, setRecoverTo] = useState("");

  // State for owner actions
  const [addRecoveryInput, setAddRecoveryInput] = useState("");
  const [removeRecoveryInput, setRemoveRecoveryInput] = useState("");
  const [ownerActionLoading, setOwnerActionLoading] = useState(false);
  const [ownerActionError, setOwnerActionError] = useState("");

  // State for Handle All Tokens Approval
  const [handleAllTokensLoading, setHandleAllTokensLoading] = useState(false);
  const [handleAllTokensError, setHandleAllTokensError] = useState("");

  // On mount, load contract address from storage and address book
  useEffect(() => {
    const stored = localStorage.getItem(RECOVERY_CONTRACT_KEY);
    if (stored && ethers.isAddress(stored)) {
      setContractAddress(stored);
      setProviderContractAddress(stored);
    }
    const book = getAddressBook();
    setAddressBook(
      Object.entries(book).map(([address, name]) => ({
        address,
        name: String(name),
      }))
    );
  }, [setProviderContractAddress]);

  // If contract loaded, fetch owner, quorum, and recovery addresses
  useEffect(() => {
    if (!contract) return;
    (async () => {
      try {
        const contractOwner = await owner();
        setIsOwner(
          contractOwner?.toLowerCase() === walletAddress?.toLowerCase()
        );
        const q = await getQuorum();
        setCurrentQuorum(q ? Number(q) : null);
        // Fetch all recovery addresses
        const count = await recoveryAddressCount();
        const addrs: string[] = [];
        if (count && Number(count) > 0) {
          for (let i = 0; i < Number(count); i++) {
            // The contract may not have a public getter for all addresses, so this is a placeholder
            // If you have a method to enumerate, use it. Otherwise, skip.
          }
        }
        setRecoveryList(addrs);
      } catch (e) {
        // ignore
      }
    })();
  }, [contract, walletAddress, owner, getQuorum, recoveryAddressCount]);

  // Validate addresses for deploy
  const validateAddresses = (addrs: string[]) => {
    return addrs.map((addr, idx) => {
      if (!addr.trim()) return "";
      if (!ethers.isAddress(addr.trim())) return "Invalid address";
      // Check for duplicates (case-insensitive)
      const lower = addr.trim().toLowerCase();
      const firstIdx = addrs.findIndex((a) => a.trim().toLowerCase() === lower);
      if (firstIdx !== idx) return "Duplicate address";
      return "";
    });
  };

  // Handlers for deploy form
  const handleAddressChange = (idx: number, value: string) => {
    const arr = [...addresses];
    arr[idx] = value;
    setAddresses(arr);
    setAddressErrors(validateAddresses(arr));
    // Adjust quorum if needed
    const validCount = arr.filter(
      (a, i) => addressErrors[i] === "" && a.trim() !== ""
    ).length;
    if (quorum > validCount) setQuorumInput(validCount || 1);
  };

  const handleAddAddress = () => {
    const errors = validateAddresses(addresses);
    setAddressErrors(errors);
    if (addresses.length > 0) {
      const lastIdx = addresses.length - 1;
      if (!addresses[lastIdx].trim() || errors[lastIdx]) {
        setDeployError(
          "Please enter a valid, unique address before adding another."
        );
        return;
      }
    }
    setAddresses([...addresses, ""]);
    setAddressErrors([...addressErrors, ""]);
    setDeployError("");
  };

  const handleRemoveAddress = (idx: number) => {
    const arr = addresses.filter((_, i) => i !== idx);
    const errors = addressErrors.filter((_, i) => i !== idx);
    setAddresses(arr);
    setAddressErrors(errors);
    const validCount = arr.filter(
      (a, i) => errors[i] === "" && a.trim() !== ""
    ).length;
    if (quorum > validCount) setQuorumInput(validCount || 1);
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeployLoading(true);
    setDeployError("");
    const errors = validateAddresses(addresses);
    setAddressErrors(errors);
    const filtered = addresses.filter(
      (addr, i) => addr.trim() !== "" && errors[i] === ""
    );
    if (filtered.length === 0) {
      setDeployError("At least one valid address is required.");
      setDeployLoading(false);
      return;
    }
    if (errors.some((err, i) => addresses[i].trim() && err)) {
      setDeployError("Please fix invalid or duplicate addresses.");
      setDeployLoading(false);
      return;
    }
    if (quorum < 1) {
      setDeployError("Quorum must be at least 1.");
      setDeployLoading(false);
      return;
    }
    if (quorum > filtered.length) {
      setDeployError("Quorum cannot exceed number of valid addresses.");
      setDeployLoading(false);
      return;
    }
    try {
      const deployedAddress = await deploy(filtered, quorum);
      if (!deployedAddress) throw new Error("Failed to deploy contract");
      setContractAddress(deployedAddress);
      setProviderContractAddress(deployedAddress);
      localStorage.setItem(RECOVERY_CONTRACT_KEY, deployedAddress);
      onRecoveryContractDeploymentSuccess?.({
        contractAddress: deployedAddress,
        recoveryAddresses: filtered,
        quorum: quorum,
        deployerAddress: walletAddress || "",
        chainId: 11155111, // Sepolia
        timestamp: Date.now(),
      });
    } catch (e: any) {
      setDeployError(e.message || "Failed to deploy contract");
    } finally {
      setDeployLoading(false);
    }
  };

  // Owner actions
  const handleAddRecoveryAddress = async () => {
    setOwnerActionLoading(true);
    setOwnerActionError("");
    try {
      if (!ethers.isAddress(addRecoveryInput))
        throw new Error("Invalid address");
      await addRecoveryAddress(addRecoveryInput);
      onRecoveryContractActionSuccess?.({
        actionType: "addRecoveryAddress",
        txHash: "", // Placeholder for txHash
        contractAddress: contractAddress,
        actionDetails: {
          address: addRecoveryInput,
        },
        signerAddress: walletAddress || "",
        chainId: 11155111, // Sepolia
        timestamp: Date.now(),
      });
      setAddRecoveryInput("");
    } catch (e: any) {
      setOwnerActionError(e.message || "Failed to add recovery address");
    } finally {
      setOwnerActionLoading(false);
    }
  };
  const handleRemoveRecoveryAddress = async () => {
    setOwnerActionLoading(true);
    setOwnerActionError("");
    try {
      if (!ethers.isAddress(removeRecoveryInput))
        throw new Error("Invalid address");
      await removeRecoveryAddress(removeRecoveryInput);
      onRecoveryContractActionSuccess?.({
        actionType: "removeRecoveryAddress",
        txHash: "", // Placeholder for txHash
        contractAddress: contractAddress,
        actionDetails: {
          address: removeRecoveryInput,
        },
        signerAddress: walletAddress || "",
        chainId: 11155111, // Sepolia
        timestamp: Date.now(),
      });
      setRemoveRecoveryInput("");
    } catch (e: any) {
      setOwnerActionError(e.message || "Failed to remove recovery address");
    } finally {
      setOwnerActionLoading(false);
    }
  };
  const handleSetQuorum = async () => {
    setOwnerActionLoading(true);
    setOwnerActionError("");
    try {
      await setQuorum(quorum);
      onRecoveryContractActionSuccess?.({
        actionType: "setQuorum",
        txHash: "", // Placeholder for txHash
        contractAddress: contractAddress,
        actionDetails: {
          quorum: quorum,
        },
        signerAddress: walletAddress || "",
        chainId: 11155111, // Sepolia
        timestamp: Date.now(),
      });
    } catch (e: any) {
      setOwnerActionError(e.message || "Failed to set quorum");
    } finally {
      setOwnerActionLoading(false);
    }
  };

  // Recovery actions
  const handleRecover = async () => {
    setRecoveryActionLoading(true);
    setRecoveryActionError("");
    try {
      if (!ethers.isAddress(selectedRecoveryAddress))
        throw new Error("Select a valid recovery address");
      if (!ethers.isAddress(recoverTo))
        throw new Error("Invalid address to recover to");
      await recover(recoverTo);
      onRecoveryContractActionSuccess?.({
        actionType: "recover",
        txHash: "", // Placeholder for txHash
        contractAddress: selectedRecoveryAddress,
        actionDetails: {
          recoverTo: recoverTo,
        },
        signerAddress: walletAddress || "",
        chainId: 11155111, // Sepolia
        timestamp: Date.now(),
      });
      setRecoverTo("");
    } catch (e: any) {
      setRecoveryActionError(e.message || "Failed to submit recovery");
    } finally {
      setRecoveryActionLoading(false);
    }
  };

  // Check if any loading state is active
  const isAnyLoading = deployLoading || ownerActionLoading || recoveryActionLoading || handleAllTokensLoading;

  // UI
  return (
    <div className="container">
      {isAnyLoading && (
        <div className="fixed-fullscreen-overlay">
          <div className="loading-content" style={{
            background: '#1a1f2e',
            padding: '32px',
            borderRadius: '12px',
            border: '2px solid #3b82f6',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
            textAlign: 'center',
            minWidth: '280px',
            maxWidth: '320px'
          }}>
            <div className="spinner" style={{
              width: '40px',
              height: '40px',
              border: '3px solid #334155',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <h3 style={{ color: '#ffffff', marginBottom: '10px', fontSize: '16px' }}>
              {deployLoading && "🏗️ Deploying Recovery Contract..."}
              {ownerActionLoading && "⚙️ Processing Owner Action..."}
              {recoveryActionLoading && "🔄 Submitting Recovery Vote..."}
              {handleAllTokensLoading && "🔐 Processing Token Approvals..."}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '12px' }}>
              Please wait while your transaction is being processed on the blockchain.
            </p>
            <div style={{ 
              background: '#0f1419', 
              padding: '10px', 
              borderRadius: '6px', 
              border: '1px solid #334155',
              fontSize: '11px',
              color: '#64748b'
            }}>
              This may take a few moments depending on network conditions.
            </div>
          </div>
        </div>
      )}
      <div className="screen">
        {/* Upper Section: Deploy or Interact as Owner */}
        {!contractAddress ? (
          <div className="multisig-content">
            <h2>Deploy Social Recovery Contract</h2>
            <form onSubmit={handleDeploy}>
              <div className="form-group">
                <label>Recovery Addresses:</label>
                {addresses.map((addr, idx) => (
                  <div
                    key={idx}
                    className="flex-align-center-gap-8 margin-bottom-8"
                  >
                    <input
                      type="text"
                      className="input"
                      value={addr}
                      placeholder={`Address #${idx + 1}`}
                      onChange={(e) => handleAddressChange(idx, e.target.value)}
                      disabled={deployLoading}
                      list="address-book-list"
                    />
                    {addresses.length > 1 && (
                      <button
                        type="button"
                        className="btn-icon margin-left-8"
                        style={{ marginLeft: 8 }}
                        onClick={() => handleRemoveAddress(idx)}
                        title="Remove address"
                        disabled={deployLoading}
                      >
                        🗑️
                      </button>
                    )}
                    {addressErrors[idx] && addr.trim() && (
                      <span className="warning margin-left-8">
                        {addressErrors[idx]}
                      </span>
                    )}
                  </div>
                ))}
                <datalist id="address-book-list">
                  {addressBook.map(({ address, name }) => (
                    <option
                      value={address}
                      key={address}
                      label={name ? `${address} (${name})` : address}
                    />
                  ))}
                </datalist>
                <button
                  type="button"
                  className="btn btn-secondary margin-top-8"
                  onClick={handleAddAddress}
                  style={{ marginTop: 8 }}
                  disabled={deployLoading}
                >
                  Add Address
                </button>
              </div>
              <div className="form-group">
                <label>Quorum Required:</label>
                <input
                  type="number"
                  className="input"
                  min={1}
                  max={
                    addresses.filter(
                      (a, i) => addressErrors[i] === "" && a.trim() !== ""
                    ).length || 1
                  }
                  value={quorum}
                  onChange={(e) => {
                    let val = Number(e.target.value);
                    const validCount = addresses.filter(
                      (a, i) => addressErrors[i] === "" && a.trim() !== ""
                    ).length;
                    if (val > validCount) val = validCount;
                    if (val < 1) val = 1;
                    setQuorumInput(val);
                  }}
                  disabled={deployLoading}
                />
              </div>
              {deployError && <div className="warning">{deployError}</div>}
              <div className="button-group">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={deployLoading}
                >
                  {deployLoading ? "Deploying..." : "Deploy Recovery Contract"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="multisig-content">
            <h2>Social Recovery Contract</h2>
            
            {/* Contract Info Section */}
            <div className="contract-info-section" style={{
              background: '#1a1f2e',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #334155',
              marginBottom: '24px'
            }}>
              <div className="margin-bottom-12">
                <span className="font-bold-16">Contract Address:</span>
                <span className="font-monospace-14 margin-left-8" style={{ color: '#3b82f6' }}>
                  {contractAddress}
                </span>
              </div>
              
              {!isLoading && (
                <div className="margin-bottom-12">
                  <span className="font-bold-16">Current Quorum:</span>
                  <span className="margin-left-8" style={{ color: '#10b981' }}>
                    {currentQuorum ?? "-"}
                  </span>
                </div>
              )}
            </div>

            {/* Token Approval Section */}
            <div className="token-approval-section" style={{
              background: '#1a1f2e',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #334155',
              marginBottom: '24px'
            }}>
              <h4 style={{ marginBottom: '16px', color: '#ffffff' }}>Token Management</h4>
              <div className="button-group">
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    setHandleAllTokensLoading(true);
                    setHandleAllTokensError("");
                    try {
                      const tokens = Object.keys(getTokenAddressBook());
                      const result = await handleAllTokensApproval(tokens);
                      onRecoveryContractActionSuccess?.({
                        actionType: "tokenApproval",
                        txHash: "", // Placeholder for txHash
                        contractAddress: contractAddress,
                        actionDetails: {
                          tokens: tokens,
                        },
                        signerAddress: walletAddress || "",
                        chainId: 11155111, // Sepolia
                        timestamp: Date.now(),
                      });
                    } catch (e: any) {
                      setHandleAllTokensError(
                        e.message || "Failed to handle all tokens approval"
                      );
                    } finally {
                      setHandleAllTokensLoading(false);
                    }
                  }}
                  disabled={handleAllTokensLoading}
                >
                  {handleAllTokensLoading
                    ? "Processing..."
                    : "Handle All Tokens Approval"}
                </button>
              </div>
              {handleAllTokensError && (
                <div className="warning margin-top-8">
                  {handleAllTokensError}
                </div>
              )}
            </div>

            {/* Owner Actions Section */}
            {isOwner && !isLoading && (
              <div className="owner-actions-section" style={{
                background: '#1a1f2e',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid #334155',
                marginBottom: '24px'
              }}>
                <h4 style={{ marginBottom: '20px', color: '#ffffff' }}>Owner Actions</h4>
                
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ marginBottom: '8px', display: 'block' }}>Add Recovery Address:</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <input
                      type="text"
                      className="input"
                      value={addRecoveryInput}
                      onChange={(e) => setAddRecoveryInput(e.target.value)}
                      placeholder="0x..."
                      disabled={ownerActionLoading}
                      list="address-book-list"
                      style={{ flex: 1 }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleAddRecoveryAddress}
                      disabled={ownerActionLoading || !addRecoveryInput}
                      style={{ minWidth: '80px' }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label style={{ marginBottom: '8px', display: 'block' }}>Remove Recovery Address:</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <input
                      type="text"
                      className="input"
                      value={removeRecoveryInput}
                      onChange={(e) => setRemoveRecoveryInput(e.target.value)}
                      placeholder="0x..."
                      disabled={ownerActionLoading}
                      list="address-book-list"
                      style={{ flex: 1 }}
                    />
                    <button
                      className="btn btn-secondary"
                      onClick={handleRemoveRecoveryAddress}
                      disabled={ownerActionLoading || !removeRecoveryInput}
                      style={{ minWidth: '80px' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ marginBottom: '8px', display: 'block' }}>Set Quorum:</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <input
                      type="number"
                      className="input"
                      min={1}
                      value={quorum}
                      onChange={(e) => setQuorumInput(Number(e.target.value))}
                      disabled={ownerActionLoading}
                      style={{ flex: 1 }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleSetQuorum}
                      disabled={ownerActionLoading}
                      style={{ minWidth: '100px' }}
                    >
                      Set Quorum
                    </button>
                  </div>
                </div>

                {ownerActionError && (
                  <div className="warning margin-top-12">
                    {ownerActionError}
                  </div>
                )}
              </div>
            )}

            {isLoading && (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#94a3b8',
                background: '#1a1f2e',
                borderRadius: '12px',
                border: '1px solid #334155'
              }}>
                Loading contract info...
              </div>
            )}
          </div>
        )}

        {/* Recovery Actions Section */}
        <div className="recovery-actions-section" style={{
          background: '#1a1f2e',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #334155'
        }}>
          <h3 style={{ marginBottom: '20px', color: '#ffffff' }}>Recovery Actions</h3>
          
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ marginBottom: '8px', display: 'block' }}>Recovery Contract Address:</label>
            <input
              type="text"
              className="input"
              value={selectedRecoveryAddress}
              onChange={(e) => setSelectedRecoveryAddress(e.target.value)}
              placeholder="0x..."
              disabled={recoveryActionLoading}
              list="address-book-list"
            />
            <datalist id="address-book-list">
              {addressBook.map(({ address, name }) => (
                <option value={address} key={address} label={name ? `${address} (${name})` : address} />
              ))}
            </datalist>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ marginBottom: '8px', display: 'block' }}>Recover To Address:</label>
            <input
              type="text"
              className="input"
              value={recoverTo}
              onChange={(e) => setRecoverTo(e.target.value)}
              placeholder="0x..."
              disabled={recoveryActionLoading}
              list="address-book-list"
            />
            <datalist id="address-book-list">
              {addressBook.map(({ address, name }) => (
                <option value={address} key={address} label={name ? `${address} (${name})` : address} />
              ))}
            </datalist>
          </div>

          <div className="button-group">
            <button
              className="btn btn-primary"
              onClick={handleRecover}
              disabled={
                recoveryActionLoading || !selectedRecoveryAddress || !recoverTo
              }
            >
              {recoveryActionLoading ? "Submitting..." : "Submit Recovery Vote"}
            </button>
          </div>

          {recoveryActionError && (
            <div className="warning margin-top-12">
              {recoveryActionError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecoveryContractScreen;
