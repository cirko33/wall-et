import React, { useState, useEffect } from "react";
import { useWallet } from "../providers/WalletProvider";

interface WalletScreenProps {
  onSendEth: () => void;
  onSendErc20: () => void;
  onCreateNewWallet: () => void;
  onViewPrivateKey: () => void;
  onUploadMultisig: () => void;
  onViewTokens: () => void;
  onViewAddressBook: () => void;
}

const WalletScreen: React.FC<WalletScreenProps> = ({
  onSendEth,
  onSendErc20,
  onCreateNewWallet,
  onViewPrivateKey,
  onUploadMultisig,
  onViewTokens,
  onViewAddressBook,
}) => {
  const { wallet, address, clearWallet, getBalance } = useWallet();
  const [balance, setBalance] = useState<string>("");
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);

  useEffect(() => {
    const fetchBalance = async () => {
      if (wallet) {
        setLoadingBalance(true);
        try {
          const bal = await getBalance();
          setBalance(bal);
        } catch (e) {
          setBalance("Error");
        } finally {
          setLoadingBalance(false);
        }
      } else {
        setBalance("");
      }
    };
    fetchBalance();
  }, [wallet, getBalance]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleClearWallet = async () => {
    if (
      confirm(
        "Are you sure you want to clear this wallet? This action cannot be undone."
      )
    ) {
      await clearWallet();
    }
  };

  const handleCreateNewWallet = async () => {
    if (
      confirm(
        "This will clear your current wallet and create a new one. Are you sure?"
      )
    ) {
      await clearWallet();
      onCreateNewWallet();
    }
  };

  if (!wallet) {
    return <div>No wallet loaded</div>;
  }

  return (
    <div className="screen">
      <div className="wallet-content">
        <div className="balance-section" style={{ marginBottom: "1em" }}>
          <div style={{ fontWeight: "bold", fontSize: "1.2em" }}>
            Balance:{" "}
            {loadingBalance
              ? "Loading..."
              : balance !== ""
              ? `${balance} ETH`
              : "--"}
          </div>
        </div>

        <div className="address-section">
          <label>Wallet Address:</label>
          <div className="input-group">
            <input
              type="text"
              id="wallet-address"
              className="input"
              value={address}
              readOnly
            />
            <button
              className="btn-icon"
              onClick={() => copyToClipboard(address)}
              title="Copy address"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="wallet-actions">
          <button className="btn btn-primary" onClick={onSendEth}>
            Send ETH
          </button>
          <button
            className="btn btn-primary"
            onClick={onSendErc20}
            style={{ marginTop: 8 }}
          >
            Send ERC20 Token
          </button>
          <button className="btn btn-secondary" onClick={onViewPrivateKey}>
            View Private Key
          </button>
          <button className="btn btn-secondary" onClick={handleClearWallet}>
            Clear Wallet
          </button>
          <button
            className="btn btn-secondary"
            onClick={onUploadMultisig}
            style={{ marginTop: 12 }}
          >
            Multisig Contracts
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletScreen;
