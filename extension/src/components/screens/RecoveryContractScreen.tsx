import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useRecoveryContract } from "../providers/RecoveryContractProvider";
import { useWallet } from "../providers/WalletProvider";
import { getAddressBook } from "../../utils/addressBookStorage";
import { getTokenAddressBook } from "../../utils/tokenAddressBookStorage";

const RECOVERY_CONTRACT_KEY = "recovery-contract";

const RecoveryContractScreen: React.FC<{
  setProviderContractAddress: (address: string) => void;
}> = ({ setProviderContractAddress }) => {
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
      alert("Social Recovery contract deployed at: " + deployedAddress);
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
      alert("Recovery address added");
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
      alert("Recovery address removed");
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
      alert("Quorum updated");
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
      alert("Recovery vote submitted");
      setRecoverTo("");
    } catch (e: any) {
      setRecoveryActionError(e.message || "Failed to submit recovery");
    } finally {
      setRecoveryActionLoading(false);
    }
  };

  // UI
  return (
    <div className="container">
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
                      label={name ? `${name}` : address}
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
            <div className="margin-bottom-12">
              <span className="font-bold-16">Address:</span>
              <span className="font-monospace-14 margin-left-8">
                {contractAddress}
              </span>
            </div>
            <div className="margin-bottom-12">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    setHandleAllTokensLoading(true);
                    setHandleAllTokensError("");
                    try {
                      const tokens = Object.keys(getTokenAddressBook());
                      const result = await handleAllTokensApproval(tokens);
                      console.log(result);
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
                <div className="warning margin-top-4">
                  {handleAllTokensError}
                </div>
              )}
            </div>

            {isLoading ? (
              <div>Loading contract info...</div>
            ) : (
              <>
                <div className="margin-bottom-12">
                  <span className="font-bold-16">Quorum:</span>
                  <span className="margin-left-8">{currentQuorum ?? "-"}</span>
                </div>
                {isOwner && (
                  <div className="margin-bottom-24">
                    <h4>Owner Actions</h4>
                    <div className="form-group">
                      <label>Add Recovery Address:</label>
                      <input
                        type="text"
                        className="input"
                        value={addRecoveryInput}
                        onChange={(e) => setAddRecoveryInput(e.target.value)}
                        placeholder="0x..."
                        disabled={ownerActionLoading}
                        list="address-book-list"
                      />
                      <datalist id="address-book-list">
                        {addressBook.map(({ address, name }) => (
                          <option
                            value={address}
                            key={address}
                            label={name ? `${name}` : address}
                          />
                        ))}
                      </datalist>
                      <button
                        className="btn btn-primary margin-top-8"
                        onClick={handleAddRecoveryAddress}
                        disabled={ownerActionLoading || !addRecoveryInput}
                      >
                        Add
                      </button>
                    </div>
                    <div className="form-group">
                      <label>Remove Recovery Address:</label>
                      <input
                        type="text"
                        className="input"
                        value={removeRecoveryInput}
                        onChange={(e) => setRemoveRecoveryInput(e.target.value)}
                        placeholder="0x..."
                        disabled={ownerActionLoading}
                        list="address-book-list"
                      />
                      <datalist id="address-book-list">
                        {addressBook.map(({ address, name }) => (
                          <option
                            value={address}
                            key={address}
                            label={name ? `${name}` : address}
                          />
                        ))}
                      </datalist>
                      <button
                        className="btn btn-secondary margin-top-8"
                        onClick={handleRemoveRecoveryAddress}
                        disabled={ownerActionLoading || !removeRecoveryInput}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="form-group">
                      <label>Set Quorum:</label>
                      <input
                        type="number"
                        className="input"
                        min={1}
                        value={quorum}
                        onChange={(e) => setQuorumInput(Number(e.target.value))}
                        disabled={ownerActionLoading}
                      />
                      <button
                        className="btn btn-primary margin-top-8"
                        onClick={handleSetQuorum}
                        disabled={ownerActionLoading}
                      >
                        Set Quorum
                      </button>
                    </div>
                    {ownerActionError && (
                      <div className="warning margin-top-4">
                        {ownerActionError}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Lower Section: Recovery Actions */}
        <div className="margin-top-24">
          <h3>Recovery Actions</h3>
          <div className="form-group">
            <label>Recovery Contract Address:</label>
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
                <option value={address} key={address} label={name || address} />
              ))}
            </datalist>
          </div>
          <div className="form-group">
            <label>Recover To Address:</label>
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
                <option value={address} key={address} label={name || address} />
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
            <div className="warning margin-top-4">{recoveryActionError}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecoveryContractScreen;
