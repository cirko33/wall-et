import React, { useState } from "react";

interface PasswordSetupScreenProps {
  onPasswordSet: (password: string) => void;
  onBack: () => void;
}

const PasswordSetupScreen: React.FC<PasswordSetupScreenProps> = ({
  onPasswordSet,
  onBack,
}) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    onPasswordSet(password);
  };

  return (
    <div className="screen">
      <div className="setup-content">
        <h2>Set Password</h2>
        <p>Create a strong password to encrypt your wallet:</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (min 8 characters)"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password:</label>
            <input
              type="password"
              id="confirm-password"
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
              Set Password
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
          <strong>⚠️ Important:</strong> This password will be used to encrypt
          your private key. Make sure to remember it - there's no way to recover
          it if you forget!
        </div>
      </div>
    </div>
  );
};

export default PasswordSetupScreen;
