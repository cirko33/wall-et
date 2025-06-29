import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ethers } from "ethers";
import crypto from "crypto-js";
import MultiSigJson from "../../../contracts/MultiSig.json";
import Erc20Json from "../../../contracts/ERC20.json";

interface WalletContextType {
  wallet: ethers.Wallet | null;
  address: string;
  isLoading: boolean;
  isPasswordSet: boolean;
  generateWallet: (password: string) => Promise<void>;
  importWallet: (privateKey: string, password: string) => Promise<void>;
  clearWallet: () => Promise<void>;
  setPassword: (password: string) => Promise<void>;
  lockWallet: () => void;
  unlockWallet: (password: string) => Promise<boolean>;
  signTransaction: (
    to: string,
    amount: string,
    gasPrice?: string
  ) => Promise<{
    signedTx: string;
    txHash: string;
    rawTx: any;
  }>;
  sendTransaction: (
    to: string,
    amount: string,
    gasPrice?: string
  ) => Promise<{
    txHash: string;
    receipt: any;
  }>;
  getBalance: () => Promise<string>;
  deployMultiSig: (signers: string[], minSignatures: number) => Promise<string>;
  sendErc20Transaction: (
    tokenAddress: string,
    to: string,
    amount: string,
    gasPrice?: string
  ) => Promise<{
    txHash: string;
    receipt: any;
  }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<ethers.Wallet | null>(null);
  const [address, setAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPasswordSet, setIsPasswordSet] = useState<boolean>(false);

  // Initialize Infura provider
  const provider = new ethers.JsonRpcProvider(
    "https://sepolia.infura.io/v3/7a796da878ac4152a6b3bfcb4fc794cb"
  );

  useEffect(() => {
    (async () => {
      // Check if wallet is unlocked and restore if so
      setIsLoading(true);
      try {
        let isUnlocked = false;
        if (typeof chrome !== "undefined" && chrome.storage) {
          const result = await chrome.storage.local.get(["isUnlocked"]);
          isUnlocked = !!result.isUnlocked;
        } else {
          isUnlocked = localStorage.getItem("is_unlocked") === "true";
        }
        const stored = await getStoredWallet();
        const passwordHash = await getStoredPasswordHash();
        setIsPasswordSet(!!stored && !!passwordHash);
        if (isUnlocked && stored && passwordHash) {
          // Try to restore wallet without password
          // Decrypt with a dummy password, since we don't have it, but we can store the private key unencrypted if needed
          // Instead, store the private key in memory when unlocked
          // We'll need to store the decrypted private key in storage when unlocked
          let decryptedPrivateKey = null;
          if (typeof chrome !== "undefined" && chrome.storage) {
            const result = await chrome.storage.local.get([
              "decryptedPrivateKey",
            ]);
            decryptedPrivateKey = result.decryptedPrivateKey;
          } else {
            decryptedPrivateKey = localStorage.getItem("decrypted_private_key");
          }
          if (
            decryptedPrivateKey &&
            /^0x?[0-9a-fA-F]{64}$/.test(decryptedPrivateKey)
          ) {
            const walletInstance = new ethers.Wallet(decryptedPrivateKey);
            const connectedWallet = walletInstance.connect(provider);
            setWallet(connectedWallet);
            setAddress(connectedWallet.address);
          }
        }
      } catch (error) {
        console.error("Error checking password status:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const encryptPrivateKey = (privateKey: string, password: string): string => {
    return crypto.AES.encrypt(privateKey, password).toString();
  };

  const decryptPrivateKey = (
    encryptedData: string,
    password: string
  ): string => {
    const bytes = crypto.AES.decrypt(encryptedData, password);
    return bytes.toString(crypto.enc.Utf8);
  };

  const generateWallet = async (password: string) => {
    try {
      setIsLoading(true);
      const newHDWallet = ethers.Wallet.createRandom();
      const newWallet = new ethers.Wallet(newHDWallet.privateKey);

      // Connect wallet to Infura provider
      const connectedWallet = newWallet.connect(provider);

      // Encrypt and store the private key
      await storeEncryptedWallet(newWallet.privateKey, password);

      setWallet(connectedWallet);
      setAddress(connectedWallet.address);
      setPassword(password);
      setIsPasswordSet(true);
    } catch (error) {
      console.error("Error generating wallet:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const importWallet = async (privateKey: string, password: string) => {
    try {
      setIsLoading(true);

      // Validate private key format
      if (!/^0x?[0-9a-fA-F]{64}$/.test(privateKey)) {
        throw new Error(
          "Invalid private key format. Please enter a 64-character hexadecimal string."
        );
      }

      const walletInstance = new ethers.Wallet(privateKey);

      // Connect wallet to Infura provider
      const connectedWallet = walletInstance.connect(provider);

      // Encrypt and store the private key
      await storeEncryptedWallet(privateKey, password);

      setWallet(connectedWallet);
      setAddress(connectedWallet.address);
      setIsPasswordSet(true);
    } catch (error) {
      console.error("Error importing wallet:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const unlockWallet = async (password: string): Promise<boolean> => {
    try {
      const storedWallet = await getStoredWallet();
      const storedPasswordHash = await getStoredPasswordHash();

      if (!storedWallet || !storedPasswordHash) {
        throw new Error("No wallet or password found");
      }

      // First verify the password hash
      const inputPasswordHash = crypto.SHA256(password).toString();
      if (inputPasswordHash !== storedPasswordHash) {
        console.error("Password hash mismatch");
        return false;
      }

      // Decrypt the private key
      const privateKey = decryptPrivateKey(
        storedWallet.encryptedPrivateKey,
        password
      );

      // Validate the decrypted private key
      if (!/^0x?[0-9a-fA-F]{64}$/.test(privateKey)) {
        console.error("Invalid private key format after decryption");
        return false;
      }

      const walletInstance = new ethers.Wallet(privateKey);
      const connectedWallet = walletInstance.connect(provider);
      setWallet(connectedWallet);
      setAddress(connectedWallet.address);
      // Persist unlocked state and decrypted private key
      if (typeof chrome !== "undefined" && chrome.storage) {
        await chrome.storage.local.set({
          isUnlocked: true,
          decryptedPrivateKey: privateKey,
        });
      } else {
        localStorage.setItem("is_unlocked", "true");
        localStorage.setItem("decrypted_private_key", privateKey);
      }
      return true;
    } catch (error) {
      console.error("Error unlocking wallet:", error);
      return false;
    }
  };

  const setPassword = async (password: string) => {
    try {
      // Store the password hash for verification (not the actual password)
      const passwordHash = crypto.SHA256(password).toString();
      await chrome.storage.local.set({ passwordHash });
    } catch (error) {
      console.error("Error setting password:", error);
      throw error;
    }
  };

  const clearWallet = async () => {
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        await chrome.storage.local.remove([
          "wallet",
          "passwordHash",
          "isUnlocked",
          "decryptedPrivateKey",
        ]);
      } else {
        localStorage.removeItem("sepolia_wallet");
        localStorage.removeItem("password_hash");
        localStorage.removeItem("is_unlocked");
        localStorage.removeItem("decrypted_private_key");
      }
      setWallet(null);
      setAddress("");
      setIsPasswordSet(false);
    } catch (error) {
      console.error("Error clearing wallet:", error);
    }
  };

  const storeEncryptedWallet = async (privateKey: string, password: string) => {
    try {
      const encryptedPrivateKey = encryptPrivateKey(privateKey, password);
      const passwordHash = crypto.SHA256(password).toString();

      const walletData = {
        encryptedPrivateKey: encryptedPrivateKey,
        address: new ethers.Wallet(privateKey).address,
        timestamp: Date.now(),
      };

      if (typeof chrome !== "undefined" && chrome.storage) {
        await chrome.storage.local.set({
          wallet: walletData,
          passwordHash: passwordHash,
        });
      } else {
        localStorage.setItem("sepolia_wallet", JSON.stringify(walletData));
        localStorage.setItem("password_hash", passwordHash);
      }
    } catch (error) {
      console.error("Error storing encrypted wallet:", error);
      throw error;
    }
  };

  const getStoredWallet = async () => {
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        const result = await chrome.storage.local.get(["wallet"]);
        return result.wallet;
      } else {
        const stored = localStorage.getItem("sepolia_wallet");
        return stored ? JSON.parse(stored) : null;
      }
    } catch (error) {
      console.error("Error retrieving stored wallet:", error);
      return null;
    }
  };

  const getStoredPasswordHash = async () => {
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        const result = await chrome.storage.local.get(["passwordHash"]);
        return result.passwordHash;
      } else {
        return localStorage.getItem("password_hash");
      }
    } catch (error) {
      console.error("Error retrieving password hash:", error);
      return null;
    }
  };

  const lockWallet = () => {
    setWallet(null);
    setAddress("");
    // Remove unlocked state and decrypted private key
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.local.set({
        isUnlocked: false,
        decryptedPrivateKey: null,
      });
    } else {
      localStorage.setItem("is_unlocked", "false");
      localStorage.removeItem("decrypted_private_key");
    }
  };

  const signTransaction = async (
    to: string,
    amount: string,
    gasPrice?: string
  ) => {
    if (!wallet) {
      throw new Error("No wallet loaded");
    }

    try {
      // Validate recipient address
      if (!ethers.isAddress(to)) {
        throw new Error("Invalid recipient address");
      }

      // Parse amount to Wei
      const amountWei = ethers.parseEther(amount);

      // Get current nonce
      const nonce = await wallet.provider?.getTransactionCount(wallet.address);

      // Get current gas price if not provided
      let gasPriceWei: ethers.BigNumberish;
      if (gasPrice) {
        gasPriceWei = ethers.parseUnits(gasPrice, "gwei");
      } else {
        // Use a default gas price for Sepolia (20 gwei)
        gasPriceWei = ethers.parseUnits("20", "gwei");
      }

      // Create transaction object
      const tx = {
        to: to,
        value: amountWei,
        gasPrice: gasPriceWei,
        gasLimit: 21000, // Standard gas limit for ETH transfer
        nonce: nonce,
        chainId: 11155111, // Sepolia chain ID
      };

      // Sign the transaction
      const signedTx = await wallet.signTransaction(tx);

      // Calculate transaction hash
      const txHash = ethers.keccak256(signedTx);

      return {
        signedTx: signedTx,
        txHash: txHash,
        rawTx: tx,
      };
    } catch (error) {
      console.error("Error signing transaction:", error);
      throw error;
    }
  };

  const sendTransaction = async (
    to: string,
    amount: string,
    gasPrice?: string
  ) => {
    if (!wallet) {
      throw new Error("No wallet loaded");
    }

    try {
      // Validate recipient address
      if (!ethers.isAddress(to)) {
        throw new Error("Invalid recipient address");
      }

      // Parse amount to Wei
      const amountWei = ethers.parseEther(amount);

      // Get current gas price if not provided
      let gasPriceWei: ethers.BigNumberish;
      if (gasPrice) {
        gasPriceWei = ethers.parseUnits(gasPrice, "gwei");
      } else {
        // Use a default gas price for Sepolia (20 gwei)
        gasPriceWei = ethers.parseUnits("20", "gwei");
      }

      // Create transaction object
      const tx = {
        to: to,
        value: amountWei,
        gasPrice: gasPriceWei,
        gasLimit: 21000, // Standard gas limit for ETH transfer
        chainId: 11155111, // Sepolia chain ID
      };

      // Send the transaction directly (ethers will handle signing and broadcasting)
      const transaction = await wallet.sendTransaction(tx);

      // Wait for the transaction to be mined
      const receipt = await transaction.wait();

      return {
        txHash: transaction.hash,
        receipt: receipt,
      };
    } catch (error) {
      console.error("Error sending transaction:", error);
      throw error;
    }
  };

  const getBalance = async () => {
    if (!wallet) {
      throw new Error("No wallet loaded");
    }
    const balance = await wallet.provider?.getBalance(wallet.address);
    if (!balance) {
      throw new Error("Failed to get balance");
    }
    return ethers.formatEther(balance);
  };

  const deployMultiSig = async (
    signers: string[],
    minSignatures: number
  ): Promise<string> => {
    if (!wallet) throw new Error("No wallet loaded");
    try {
      // Use the user's wallet as signer
      const signer = wallet.connect(provider);
      const abi = MultiSigJson.abi;
      // @ts-ignore
      const bytecode = MultiSigJson.bytecode?.object || MultiSigJson.bytecode;
      const factory = new ethers.ContractFactory(abi, bytecode, signer);
      if (!signers.every((addr) => ethers.isAddress(addr))) {
        throw new Error("All signers must be valid Ethereum addresses");
      }

      const contract = await factory.deploy(signers, minSignatures);
      return contract.getAddress();
    } catch (e: any) {
      console.error("Error deploying MultiSig contract:", e);
      throw e;
    }
  };

  const sendErc20Transaction = async (
    tokenAddress: string,
    to: string,
    amount: string,
    gasPrice?: string
  ) => {
    if (!wallet) {
      throw new Error("No wallet loaded");
    }

    try {
      // Validate recipient address
      if (!ethers.isAddress(to)) {
        throw new Error("Invalid recipient address");
      }

      // Parse amount to Wei
      const amountWei = ethers.parseEther(amount);

      // Get current gas price if not provided
      let gasPriceWei: ethers.BigNumberish;
      if (gasPrice) {
        gasPriceWei = ethers.parseUnits(gasPrice, "gwei");
      } else {
        // Use a default gas price for Sepolia (20 gwei)
        gasPriceWei = ethers.parseUnits("20", "gwei");
      }

      // Create transaction object
      const tx = {
        to: to,
        value: amountWei,
        gasPrice: gasPriceWei,
        gasLimit: 21000, // Standard gas limit for ETH transfer
        chainId: 11155111, // Sepolia chain ID
      };

      const contract = new ethers.Contract(tokenAddress, Erc20Json.abi, wallet);

      // Send the transaction directly (ethers will handle signing and broadcasting)
      const transaction = await contract["transfer(address,uint256)"](
        to,
        amountWei
      );

      // Wait for the transaction to be mined
      const receipt = await transaction.wait();

      return {
        txHash: transaction.hash,
        receipt: receipt,
      };
    } catch (error) {
      console.error("Error sending ERC20 transaction:", error);
      throw error;
    }
  };

  const value: WalletContextType = {
    wallet,
    address,
    isLoading,
    isPasswordSet,
    generateWallet,
    importWallet,
    clearWallet,
    setPassword,
    unlockWallet,
    lockWallet,
    signTransaction,
    sendTransaction,
    getBalance,
    deployMultiSig,
    sendErc20Transaction,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
