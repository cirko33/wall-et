import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import CryptoJS from 'crypto-js';

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
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<ethers.Wallet | null>(null);
  const [address, setAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPasswordSet, setIsPasswordSet] = useState<boolean>(false);

  useEffect(() => {
    checkPasswordStatus();
  }, []);

  const checkPasswordStatus = async () => {
    try {
      const stored = await getStoredWallet();
      const passwordHash = await getStoredPasswordHash();
      setIsPasswordSet(!!stored && !!passwordHash);
    } catch (error) {
      console.error('Error checking password status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const encryptPrivateKey = (privateKey: string, password: string): string => {
    return CryptoJS.AES.encrypt(privateKey, password).toString();
  };

  const decryptPrivateKey = (encryptedData: string, password: string): string => {
    const bytes = CryptoJS.AES.decrypt(encryptedData, password);
    return bytes.toString(CryptoJS.enc.Utf8);
  };

  const generateWallet = async (password: string) => {
    try {
      setIsLoading(true);
      const newWallet = ethers.Wallet.createRandom();
      
      // Encrypt and store the private key
      await storeEncryptedWallet(newWallet.privateKey, password);
      
      setWallet(newWallet);
      setAddress(newWallet.address);
      setIsPasswordSet(true);
    } catch (error) {
      console.error('Error generating wallet:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const importWallet = async (privateKey: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Validate private key format
      if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
        throw new Error('Invalid private key format. Please enter a 64-character hexadecimal string.');
      }

      const walletInstance = new ethers.Wallet(privateKey);
      
      // Encrypt and store the private key
      await storeEncryptedWallet(privateKey, password);
      
      setWallet(walletInstance);
      setAddress(walletInstance.address);
      setIsPasswordSet(true);
    } catch (error) {
      console.error('Error importing wallet:', error);
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
        throw new Error('No wallet or password found');
      }

      // First verify the password hash
      const inputPasswordHash = CryptoJS.SHA256(password).toString();
      if (inputPasswordHash !== storedPasswordHash) {
        console.error('Password hash mismatch');
        return false;
      }

      // Decrypt the private key
      const privateKey = decryptPrivateKey(storedWallet.encryptedPrivateKey, password);
      
      // Validate the decrypted private key
      if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
        console.error('Invalid private key format after decryption');
        return false;
      }

      const walletInstance = new ethers.Wallet(privateKey);
      setWallet(walletInstance);
      setAddress(walletInstance.address);
      return true;
    } catch (error) {
      console.error('Error unlocking wallet:', error);
      return false;
    }
  };

  const setPassword = async (password: string) => {
    try {
      // Store the password hash for verification (not the actual password)
      const passwordHash = CryptoJS.SHA256(password).toString();
      await chrome.storage.local.set({ passwordHash });
    } catch (error) {
      console.error('Error setting password:', error);
      throw error;
    }
  };

  const clearWallet = async () => {
    try {
      await chrome.storage.local.remove(['wallet', 'passwordHash']);
      setWallet(null);
      setAddress('');
      setIsPasswordSet(false);
    } catch (error) {
      console.error('Error clearing wallet:', error);
    }
  };

  const storeEncryptedWallet = async (privateKey: string, password: string) => {
    try {
      const encryptedPrivateKey = encryptPrivateKey(privateKey, password);
      const passwordHash = CryptoJS.SHA256(password).toString();
      
      const walletData = {
        encryptedPrivateKey: encryptedPrivateKey,
        address: new ethers.Wallet(privateKey).address,
        timestamp: Date.now()
      };
      
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ 
          wallet: walletData,
          passwordHash: passwordHash
        });
      } else {
        localStorage.setItem('sepolia_wallet', JSON.stringify(walletData));
        localStorage.setItem('password_hash', passwordHash);
      }
    } catch (error) {
      console.error('Error storing encrypted wallet:', error);
      throw error;
    }
  };

  const getStoredWallet = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['wallet']);
        return result.wallet;
      } else {
        const stored = localStorage.getItem('sepolia_wallet');
        return stored ? JSON.parse(stored) : null;
      }
    } catch (error) {
      console.error('Error retrieving stored wallet:', error);
      return null;
    }
  };

  const getStoredPasswordHash = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['passwordHash']);
        return result.passwordHash;
      } else {
        return localStorage.getItem('password_hash');
      }
    } catch (error) {
      console.error('Error retrieving password hash:', error);
      return null;
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
    unlockWallet
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}; 