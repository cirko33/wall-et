import React, { useState } from "react";
import { useWallet } from "../providers/WalletProvider";
import CryptoJS from "crypto-js";

interface SignOutScreenProps {
  onBack: () => void;
}

const SignOutScreen: React.FC<SignOutScreenProps> = ({ onBack }) => {
  const { wallet } = useWallet();
  const [password, setPassword] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const verifyPassword = async (password: string): Promise<boolean> => {
    try {
      // Get stored password hash
      const result = await chrome.storage.local.get(["passwordHash"]);
      const storedPasswordHash = result.passwordHash;

      if (!storedPasswordHash) {
        return false;
      }

      // Verify password hash
      const inputPasswordHash = CryptoJS.SHA256(password).toString();
      return inputPasswordHash === storedPasswordHash;
    } catch (error) {
      console.error("Error verifying password:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!password) {
      setError("Please enter your password");
      setIsLoading(false);
      return;
    }

    try {
      const isValid = await verifyPassword(password);
      if (isValid) {
        setShowConfirmation(true);
        setPassword("");
      } else {
        setError("Invalid password. Please try again.");
      }
    } catch (error) {
      setError("Error verifying password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSignOut = async () => {
    try {
      setIsLoading(true);
      
      // Clear all extension data
        localStorage.clear();
      console.log("Clearing extension data");
      if (typeof chrome !== "undefined" && chrome.storage) {
        await chrome.storage.local.clear();
      } else {
        // Clear all localStorage items including multisig data
        localStorage.clear();
        
        // Also explicitly clear specific keys to be thorough
        localStorage.removeItem("multisigContracts");
        localStorage.removeItem("addressBook");
        localStorage.removeItem("tokenAddressBook");
        
        // Clear all multisig transaction data (keys like "multisigTxs:0x...")
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("multisigTxs:")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
      
      // Reload the extension to start fresh
      if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.reload();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("Error signing out:", error);
      setError("Error signing out. Please try again.");
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setShowConfirmation(false);
    setPassword("");
    setError("");
    onBack();
  };

  if (!wallet) {
    return <div>No wallet loaded</div>;
  }

  return (
    <div className="screen">
      <div className="setup-content">
        <h2>Sign Out</h2>

        {!showConfirmation ? (
          <>
            <p>Enter your password to sign out and clear all data:</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="signout-password">Password:</label>
                <input
                  type="password"
                  id="signout-password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && <div className="warning">{error}</div>}

              <div className="button-group">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Continue"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleBack}
                >
                  Back
                </button>
              </div>
            </form>

            <div className="warning">
              <strong>⚠️ Warning:</strong> This action will permanently delete all wallet data, 
              including your private key, address book, tokens, and multisig contracts. 
              This action cannot be undone. Make sure you have backed up your private key 
              if you want to recover this wallet later.
            </div>
          </>
        ) : (
          <>
            <p>Are you absolutely sure you want to sign out?</p>

            <div className="warning">
              <strong>🚨 Final Warning:</strong> This will permanently delete:
              <ul style={{ marginTop: "8px", marginLeft: "20px" }}>
                <li>Your wallet private key</li>
                <li>All saved addresses</li>
                <li>All token information</li>
                <li>All multisig contracts</li>
                <li>All extension settings</li>
              </ul>
              <br />
              <strong>This action cannot be undone!</strong>
            </div>

            <div className="button-group">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleConfirmSignOut}
                disabled={isLoading}
                style={{ backgroundColor: "#ef4444", borderColor: "#ef4444" }}
              >
                {isLoading ? "Signing Out..." : "Yes, Sign Out & Clear All Data"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleBack}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SignOutScreen; 