import React from "react";

interface GeneratedWalletScreenProps {
  walletData: {
    privateKey: string;
    address: string;
  } | null;
  onContinue: () => void;
}

const GeneratedWalletScreen: React.FC<GeneratedWalletScreenProps> = ({
  walletData,
  onContinue,
}) => {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  if (!walletData) {
    return <div>No wallet data available</div>;
  }

  return (
    <div className="container">
      <div className="screen">
        <div className="generated-content">
          <h2>Wallet Generated Successfully!</h2>
          <p>
            Your new wallet has been created. Please save your private key
            securely:
          </p>

          <div className="private-key-display">
            <div className="input-group">
              <input
                type="text"
                value={walletData.privateKey}
                readOnly
                className="input"
              />
              <button
                onClick={() => copyToClipboard(walletData.privateKey)}
                className="btn-icon"
              >
                📋
              </button>
            </div>
            <small className="warning">
              ⚠️ Save this private key! You won't be able to see it again.
            </small>
          </div>

          <div className="address-display">
            <label>Wallet Address:</label>
            <div className="input-group">
              <input
                type="text"
                value={walletData.address}
                readOnly
                className="input"
              />
              <button
                onClick={() => copyToClipboard(walletData.address)}
                className="btn-icon"
              >
                📋
              </button>
            </div>
          </div>

          <button onClick={onContinue} className="btn btn-primary">
            Continue to Wallet
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeneratedWalletScreen;
