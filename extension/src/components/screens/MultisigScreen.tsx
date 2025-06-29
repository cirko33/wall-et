import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWallet } from "../providers/WalletProvider";
import {
  addMultisigContract,
  getMultisigContracts,
} from "../../utils/multisigStorage";

interface MultisigScreenProps {
  onBack: () => void;
  onOpenMultisigInteract: (addr: string) => void;
}

const MultisigScreen: React.FC<MultisigScreenProps> = ({
  onBack,
  onOpenMultisigInteract,
}) => {
  const [addresses, setAddresses] = useState<string[]>([""]);
  const [minSignatures, setMinSignatures] = useState<number>(1);
  const [error, setError] = useState<string>("");
  const [addressErrors, setAddressErrors] = useState<string[]>([""]);
  const { deployMultiSig } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [savedMultisigs, setSavedMultisigs] = useState<string[]>([]);
  const [customMultisig, setCustomMultisig] = useState<string>("");
  const [customMultisigError, setCustomMultisigError] = useState<string>("");

  useEffect(() => {
    setSavedMultisigs(getMultisigContracts());
  }, []);

  // Validate all addresses, including duplicates
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

  const handleAddressChange = (idx: number, value: string) => {
    const arr = [...addresses];
    arr[idx] = value;
    setAddresses(arr);
    const errors = validateAddresses(arr);
    setAddressErrors(errors);
    // If removing an address makes minSignatures too high, adjust it
    const validCount = arr.filter(
      (a, i) => errors[i] === "" && a.trim() !== ""
    ).length;
    if (minSignatures > validCount) setMinSignatures(validCount || 1);
  };

  const handleAddAddress = () => {
    // Prevent adding if last address is not valid or is duplicate
    const errors = validateAddresses(addresses);
    setAddressErrors(errors);
    if (addresses.length > 0) {
      const lastIdx = addresses.length - 1;
      if (!addresses[lastIdx].trim() || errors[lastIdx]) {
        setError("Please enter a valid, unique address before adding another.");
        return;
      }
    }
    setAddresses([...addresses, ""]);
    setAddressErrors([...addressErrors, ""]);
    setError("");
  };

  const handleRemoveAddress = (idx: number) => {
    const arr = addresses.filter((_, i) => i !== idx);
    const errors = addressErrors.filter((_, i) => i !== idx);
    setAddresses(arr);
    setAddressErrors(errors);
    const validCount = arr.filter(
      (a, i) => errors[i] === "" && a.trim() !== ""
    ).length;
    if (minSignatures > validCount) setMinSignatures(validCount || 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();
      setIsLoading(true);
      const errors = validateAddresses(addresses);
      setAddressErrors(errors);
      const filtered = addresses.filter(
        (addr, i) => addr.trim() !== "" && errors[i] === ""
      );
      if (filtered.length === 0) {
        setError("At least one valid address is required.");
        setIsLoading(false);
        return;
      }
      if (errors.some((err, i) => addresses[i].trim() && err)) {
        setError("Please fix invalid or duplicate addresses.");
        setIsLoading(false);
        return;
      }
      if (minSignatures < 1) {
        setError("Minimum signatures must be at least 1.");
        setIsLoading(false);
        return;
      }
      if (minSignatures > filtered.length) {
        setError("Minimum signatures cannot exceed number of valid addresses.");
        setIsLoading(false);
        return;
      }
      setError("");
      const multiSigAddress = await deployMultiSig(addresses, minSignatures);
      addMultisigContract(multiSigAddress);
      setSavedMultisigs(getMultisigContracts());
      alert("Multisig contract deployed at: " + multiSigAddress);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update minSignatures if addresses change
  useEffect(() => {
    const errors = validateAddresses(addresses);
    const validCount = addresses.filter(
      (a, i) => errors[i] === "" && a.trim() !== ""
    ).length;
    if (minSignatures > validCount) setMinSignatures(validCount || 1);
  }, [addresses]);

  // Add a custom multisig address to the saved list if valid and not already present
  const handleAddCustomMultisig = () => {
    const addr = customMultisig.trim();
    if (!addr) {
      setCustomMultisigError("");
      return;
    }
    if (!ethers.isAddress(addr)) {
      setCustomMultisigError("Invalid address");
      return;
    }
    setCustomMultisigError("");
    if (!savedMultisigs.includes(addr)) {
      addMultisigContract(addr);
      setSavedMultisigs(getMultisigContracts());
    }
    setCustomMultisig("");
    onOpenMultisigInteract(addr);
  };

  // Remove a multisig address from the saved list
  const handleRemoveSavedMultisig = (addr: string) => {
    const updated = savedMultisigs.filter((a) => a !== addr);
    localStorage.setItem("multisigContracts", JSON.stringify(updated));
    setSavedMultisigs(updated);
  };

  return (
    <div className="container">
      <div className="screen">
        <div className="multisig-content">
          <h2>Deploy MultiSig Contract</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Addresses:</label>
              {addresses.map((addr, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <input
                    type="text"
                    className="input"
                    value={addr}
                    placeholder={`Address #${idx + 1}`}
                    onChange={(e) => handleAddressChange(idx, e.target.value)}
                    disabled={isLoading}
                  />
                  {addresses.length > 1 && (
                    <button
                      type="button"
                      className="btn-icon"
                      style={{ marginLeft: 8 }}
                      onClick={() => handleRemoveAddress(idx)}
                      title="Remove address"
                      disabled={isLoading}
                    >
                      🗑️
                    </button>
                  )}
                  {addressErrors[idx] && addr.trim() && (
                    <span className="warning" style={{ marginLeft: 8 }}>
                      {addressErrors[idx]}
                    </span>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleAddAddress}
                style={{ marginTop: 8 }}
                disabled={isLoading}
              >
                Add Address
              </button>
            </div>
            <div className="form-group">
              <label>Minimum Signatures Required:</label>
              <input
                type="number"
                className="input"
                min={1}
                max={
                  addresses.filter(
                    (a, i) => addressErrors[i] === "" && a.trim() !== ""
                  ).length || 1
                }
                value={minSignatures}
                onChange={(e) => {
                  let val = Number(e.target.value);
                  const validCount = addresses.filter(
                    (a, i) => addressErrors[i] === "" && a.trim() !== ""
                  ).length;
                  if (val > validCount) val = validCount;
                  if (val < 1) val = 1;
                  setMinSignatures(val);
                }}
                disabled={isLoading}
              />
            </div>
            {error && <div className="warning">{error}</div>}
            <div className="button-group">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? "Deploying..." : "Deploy Multisig"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onBack}
                disabled={isLoading}
              >
                Back
              </button>
            </div>
          </form>
        </div>

        {/* Multisig Interact Section */}
        <div className="multisig-interact" style={{ marginBottom: 24 }}>
          <h3>Interact with MultiSig Contract</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              list="saved-multisigs-list"
              className="input"
              placeholder="Enter or select multisig address"
              value={customMultisig}
              onChange={(e) => {
                setCustomMultisig(e.target.value);
                if (e.target.value && !ethers.isAddress(e.target.value)) {
                  setCustomMultisigError("Invalid address");
                } else {
                  setCustomMultisigError("");
                }
              }}
              disabled={isLoading}
              style={{ width: 340 }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddCustomMultisig();
                }
              }}
            />
            <datalist id="saved-multisigs-list">
              {savedMultisigs.map((addr) => (
                <option value={addr} key={addr} />
              ))}
            </datalist>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddCustomMultisig}
              disabled={isLoading || !customMultisig || !!customMultisigError}
            >
              Go
            </button>
          </div>
          {customMultisigError && (
            <div className="warning" style={{ marginTop: 4 }}>
              {customMultisigError}
            </div>
          )}
        </div>
        {/* Saved Multisigs Management Section */}
        {savedMultisigs.length > 0 && (
          <div className="saved-multisigs" style={{ marginBottom: 24 }}>
            <h4>Saved MultiSig Contracts</h4>
            <ul style={{ paddingLeft: 16 }}>
              {savedMultisigs.map((addr, idx) => (
                <li
                  key={addr}
                  style={{
                    fontFamily: "monospace",
                    fontSize: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{ cursor: "pointer" }}
                    title="Open multisig"
                    onClick={() => onOpenMultisigInteract(addr)}
                  >
                    {idx + 1}. {addr}
                  </span>
                  <button
                    type="button"
                    className="btn-icon"
                    title="Remove from saved"
                    onClick={() => handleRemoveSavedMultisig(addr)}
                    style={{ color: "#c00", marginLeft: 8 }}
                  >
                    🗑️
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultisigScreen;
