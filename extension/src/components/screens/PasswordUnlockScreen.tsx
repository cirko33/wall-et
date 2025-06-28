import React, { useState } from "react";

interface PasswordUnlockScreenProps {
  onUnlock: (password: string) => void;
}

const PasswordUnlockScreen: React.FC<PasswordUnlockScreenProps> = ({
  onUnlock,
}) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter your password");
      return;
    }

    onUnlock(password);
  };

  return (
    <div className="screen">
      <div className="setup-content">
        <h2>Unlock Wallet</h2>
        <p>Enter your password to unlock your wallet:</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="unlock-password">Password:</label>
            <input
              type="password"
              id="unlock-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <div className="warning">{error}</div>}

          <div className="button-group">
            <button type="submit" className="btn btn-primary">
              Unlock Wallet
            </button>
          </div>
        </form>

        <div className="warning">
          <strong>Remember:</strong> If you forget your password, you won't be
          able to access your wallet. Make sure to keep your password safe!
        </div>
      </div>
    </div>
  );
};

export default PasswordUnlockScreen;
