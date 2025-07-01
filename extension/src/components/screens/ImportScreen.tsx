import React, { useState } from "react";

interface ImportScreenProps {
  onBack: () => void;
  onImport: (privateKey: string, password: string) => void;
}

const ImportScreen: React.FC<ImportScreenProps> = ({ onBack, onImport }) => {
  const [privateKey, setPrivateKey] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!privateKey.trim()) {
      setError("Please enter a private key");
      return;
    }

    if (!/^0x?[0-9a-fA-F]{64}$/.test(privateKey)) {
      setError(
        "Invalid private key format. Please enter a 64-character hexadecimal string."
      );
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    onImport(privateKey.trim(), password);
  };

  return (
    <div className="container">
      <div className="screen">
        <div className="import-content">
          <h2>Import Wallet</h2>
          <p>
            Enter your private key and set a password to import your wallet:
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="private-key-input">Private Key:</label>
              <input
                type="text"
                id="private-key-input"
                className="input"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="Enter your 64-character private key"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="import-password">Password:</label>
              <input
                type="password"
                id="import-password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 8 characters)"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="import-confirm-password">Confirm Password:</label>
              <input
                type="password"
                id="import-confirm-password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>

            {error && <div className="warning">{error}</div>}

            <div className="button-group">
              <button type="submit" className="btn btn-primary">
                Import Wallet
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onBack}
              >
                Back
              </button>
            </div>
          </form>

          <div className="warning">
            <strong>⚠️ Security Warning:</strong> Your private key will be
            encrypted with the password you provide. Make sure to remember this
            password - you'll need it to unlock your wallet!
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportScreen;
