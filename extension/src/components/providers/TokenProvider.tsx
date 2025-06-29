import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { ethers } from "ethers";
import { useWallet } from "./WalletProvider";
import Erc20Json from "../../../contracts/ERC20.json";
import {
  addToTokenAddressBook,
  getTokenAddressBook,
  TokenInfo,
} from "../../utils/tokenAddressBookStorage";

interface TokenContextType {
  getTokenInfo: (tokenAddress: string) => Promise<TokenInfo | null>;
  getTokenBalance: (tokenAddress: string) => Promise<number | null>;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

interface TokenProviderProps {
  children: ReactNode;
}

export const TokenProvider: React.FC<TokenProviderProps> = ({ children }) => {
  const { wallet } = useWallet();

  const getTokenInfo = async (tokenAddress: string) => {
    try {
      const tokenInfo = getTokenAddressBook()[tokenAddress];
      if (tokenInfo) {
        return tokenInfo;
      }

      const tokenContract = new ethers.Contract(
        tokenAddress,
        Erc20Json.abi,
        wallet
      );
      console.log("🚀 ~ getTokenInfo ~ tokenContract:", tokenContract);

      const name = await tokenContract["name()"]();
      const symbol = await tokenContract["symbol()"]();
      const decimals = (await tokenContract[
        "decimals()"
      ]()) as ethers.BigNumberish;
      const convertedDecimals = Number(decimals);
      addToTokenAddressBook(tokenAddress, name, symbol, convertedDecimals);
      return { name, symbol, decimals: convertedDecimals } as TokenInfo;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const getTokenBalance = async (tokenAddress: string) => {
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        Erc20Json.abi,
        wallet
      );
      const balance = await tokenContract["balanceOf(address)"](
        wallet?.address
      );

      return balance;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const value = {
    getTokenInfo,
    getTokenBalance,
  };

  return (
    <TokenContext.Provider value={value}>{children}</TokenContext.Provider>
  );
};

export const useToken = () => {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error("useToken must be used within a TokenProvider");
  }
  return context;
};
