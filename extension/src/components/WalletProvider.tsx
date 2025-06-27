import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ethers } from "ethers";
import crypto from "crypto-js";

interface WalletContextType {
  wallet: ethers.Wallet | null;
  address: string;
  isLoading: boolean;
  isPasswordSet: boolean;
  generateWallet: (password: string) => Promise<void>;
  importWallet: (privateKey: string, password: string) => Promise<void>;
  clearWallet: () => Promise<void>;
  setPassword: (password: string) => Promise<void>;
  unlockWallet: (password: string) => Promise<boolean>;
  signTransaction: (to: string, amount: string, gasPrice?: string) => Promise<{
    signedTx: string;
    txHash: string;
    rawTx: any;
  }>;
  sendTransaction: (to: string, amount: string, gasPrice?: string) => Promise<{
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
  const provider = new ethers.providers.JsonRpcProvider(
    'https://sepolia.infura.io/v3/7a796da878ac4152a6b3bfcb4fc794cb'
  );

  useEffect(() => {
    checkPasswordStatus();
  }, []);

  const checkPasswordStatus = async () => {
    try {
      const stored = await getStoredWallet();
      const passwordHash = await getStoredPasswordHash();
      setIsPasswordSet(!!stored && !!passwordHash);
    } catch (error) {
      console.error("Error checking password status:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
      const newWallet = ethers.Wallet.createRandom();

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

      console.log("Decrypted private key:", privateKey);
      // Validate the decrypted private key
      if (!/^0x?[0-9a-fA-F]{64}$/.test(privateKey)) {
        console.error("Invalid private key format after decryption");
        return false;
      }

      const walletInstance = new ethers.Wallet(privateKey);
      
      // Connect wallet to Infura provider
      const connectedWallet = walletInstance.connect(provider);
      
      setWallet(connectedWallet);
      setAddress(connectedWallet.address);
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
      await chrome.storage.local.remove(["wallet", "passwordHash"]);
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
    // Do not clear password hash or wallet from storage, just lock in memory
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
    signTransaction: async (to: string, amount: string, gasPrice?: string) => {
      if (!wallet) {
        throw new Error("No wallet loaded");
      }

      try {
        // Validate recipient address
        if (!ethers.utils.isAddress(to)) {
          throw new Error("Invalid recipient address");
        }

        // Parse amount to Wei
        const amountWei = ethers.utils.parseEther(amount);

        // Get current nonce
        const nonce = await wallet.getTransactionCount();

        // Get current gas price if not provided
        let gasPriceWei: ethers.BigNumber;
        if (gasPrice) {
          gasPriceWei = ethers.utils.parseUnits(gasPrice, 'gwei');
        } else {
          // Use a default gas price for Sepolia (20 gwei)
          gasPriceWei = ethers.utils.parseUnits('20', 'gwei');
        }

        // Create transaction object
        const tx = {
          to: to,
          value: amountWei,
          gasPrice: gasPriceWei,
          gasLimit: 21000, // Standard gas limit for ETH transfer
          nonce: nonce,
          chainId: 11155111 // Sepolia chain ID
        };

        // Sign the transaction
        const signedTx = await wallet.signTransaction(tx);
        
        // Calculate transaction hash
        const txHash = ethers.utils.keccak256(signedTx);

        return {
          signedTx: signedTx,
          txHash: txHash,
          rawTx: tx
        };
      } catch (error) {
        console.error("Error signing transaction:", error);
        throw error;
      }
    },
    sendTransaction: async (to: string, amount: string, gasPrice?: string) => {
      if (!wallet) {
        throw new Error("No wallet loaded");
      }

      try {
        // Validate recipient address
        if (!ethers.utils.isAddress(to)) {
          throw new Error("Invalid recipient address");
        }

        // Parse amount to Wei
        const amountWei = ethers.utils.parseEther(amount);

        // Get current gas price if not provided
        let gasPriceWei: ethers.BigNumber;
        if (gasPrice) {
          gasPriceWei = ethers.utils.parseUnits(gasPrice, 'gwei');
        } else {
          // Use a default gas price for Sepolia (20 gwei)
          gasPriceWei = ethers.utils.parseUnits('20', 'gwei');
        }

        // Create transaction object
        const tx = {
          to: to,
          value: amountWei,
          gasPrice: gasPriceWei,
          gasLimit: 21000, // Standard gas limit for ETH transfer
          chainId: 11155111 // Sepolia chain ID
        };

        // Send the transaction directly (ethers will handle signing and broadcasting)
        const transaction = await wallet.sendTransaction(tx);
        
        // Wait for the transaction to be mined
        const receipt = await transaction.wait();

        return {
          txHash: transaction.hash,
          receipt: receipt
        };
      } catch (error) {
        console.error("Error sending transaction:", error);
        throw error;
      }
    },
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
