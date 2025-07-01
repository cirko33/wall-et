import React, { useState } from "react";
import { useWallet } from "../providers/WalletProvider";
import CryptoJS from "crypto-js";

interface ViewPrivateKeyScreenProps {
  onBack: () => void;
}

const ViewPrivateKeyScreen: React.FC<ViewPrivateKeyScreenProps> = ({
  onBack,
}) => {
  const { wallet } = useWallet();
  const [password, setPassword] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
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
        setShowPrivateKey(true);
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Private key copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleBack = () => {
    setShowPrivateKey(false);
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
        <h2>View Private Key</h2>

        {!showPrivateKey ? (
          <>
            <p>Enter your password to view your private key:</p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="view-key-password">Password:</label>
                <input
                  type="password"
                  id="view-key-password"
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
                  {isLoading ? "Verifying..." : "View Private Key"}
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
              <strong>Security Warning:</strong> Your private key gives full
              access to your wallet. Never share it with anyone and ensure your
              screen is not being recorded.
            </div>
          </>
        ) : (
          <>
            <p>Your private key (keep it secure):</p>

            <div className="form-group">
              <label>Private Key:</label>
              <div className="input-group">
                <input
                  type="text"
                  className="input"
                  value={wallet.privateKey}
                  readOnly
                />
                <button
                  className="btn-icon"
                  onClick={() => copyToClipboard(wallet.privateKey)}
                  title="Copy private key"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="warning">
              <strong>⚠️ Critical:</strong> This private key gives complete
              control over your wallet. Store it securely and never share it
              with anyone!
            </div>

            <div className="button-group">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleBack}
              >
                Back to Wallet
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewPrivateKeyScreen;
