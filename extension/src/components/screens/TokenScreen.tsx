import React, { useEffect, useState } from "react";
import {
  getTokenAddressBook,
  TokenInfo,
  addToTokenAddressBook,
} from "../../utils/tokenAddressBookStorage";
import { useToken } from "../providers/TokenProvider";

interface TokenScreenProps {
  onBack: () => void;
}

const TokenScreen: React.FC<TokenScreenProps> = ({ onBack }) => {
  const [tokens, setTokens] = useState<{ address: string; info: TokenInfo }[]>(
    []
  );
  const [balances, setBalances] = useState<Record<string, string>>({});
  const { getTokenBalance, getTokenInfo } = useToken();
  const [newToken, setNewToken] = useState({
    address: "",
    name: "",
    symbol: "",
    decimals: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const addressBook = getTokenAddressBook();
    setTokens(
      Object.entries(addressBook).map(([address, info]) => ({ address, info }))
    );
  }, []);

  useEffect(() => {
    const fetchBalances = async () => {
      const newBalances: Record<string, string> = {};
      for (const { address, info } of tokens) {
        try {
          const bal = await getTokenBalance(address);
          if (bal !== null) {
            // Format balance using decimals
            const formatted = (
              Number(bal) /
              10 ** info.decimals
            ).toLocaleString();
            newBalances[address] = formatted;
          } else {
            newBalances[address] = "-";
          }
        } catch {
          newBalances[address] = "-";
        }
      }
      setBalances(newBalances);
    };
    if (tokens.length > 0) fetchBalances();
  }, [tokens, getTokenBalance]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewToken((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const { address } = newToken;
    if (!address) {
      setError("Token address is required.");
      return;
    }
    try {
      // Try to fetch token info
      const info = await getTokenInfo(address);
      if (!info) {
        setError(
          "Could not fetch token info. Make sure the address is correct."
        );
        return;
      }

      // Refresh token list
      const addressBook = getTokenAddressBook();
      setTokens(
        Object.entries(addressBook).map(([address, info]) => ({
          address,
          info,
        }))
      );
      setNewToken({ address: "", name: "", symbol: "", decimals: "" });
    } catch (err) {
      setError("Failed to add token. Check input values.");
    }
  };

  return (
    <div className="screen">
      <div className="token-content">
        <h2>Tokens</h2>
        <form onSubmit={handleAddToken}>
          <div className="form-group margin-bottom-0">
            <label htmlFor="token-address">Token Address:</label>
            <input
              type="text"
              id="token-address"
              name="address"
              className="input"
              placeholder="Token Address"
              value={newToken.address}
              onChange={handleInputChange}
            />
          </div>
          {error && <div className="warning margin-top-4">{error}</div>}
          <div className="button-group margin-top-12">
            <button
              className="btn btn-primary"
              type="submit"
              onClick={handleAddToken}
            >
              Add Token
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={onBack}
            >
              Back
            </button>
          </div>
        </form>
        <div className="margin-top-24">
          {tokens.length === 0 ? (
            <div>No tokens in address book.</div>
          ) : (
            <div className="flex-col-gap-12">
              {tokens.map(({ address, info }) => (
                <TokenChip
                  key={address}
                  address={address}
                  name={info.name}
                  symbol={info.symbol}
                  balance={balances[address] ?? "..."}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TokenChip: React.FC<{
  address: string;
  name: string;
  symbol: string;
  balance: string;
}> = ({ address, name, symbol, balance }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <div
      onClick={handleCopy}
      className={`token-chip${copied ? " copied" : ""}`}
      title="Click to copy address"
    >
      <div className="flex-col-gap-2">
        <span className="token-chip-symbol">{symbol}</span>
        <span className="token-chip-name">{name}</span>
      </div>
      <div className="token-chip-balance">{balance}</div>
      <div className={`token-chip-address${copied ? " copied" : ""}`}>
        {copied ? "Copied!" : address.slice(0, 6) + "..." + address.slice(-4)}
      </div>
    </div>
  );
};

export default TokenScreen;
