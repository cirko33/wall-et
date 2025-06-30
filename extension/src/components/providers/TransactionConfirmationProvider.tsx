import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { ethers } from "ethers";
import TransactionConfirmationPopup, {
  TransactionDetails,
} from "../TransactionConfirmationPopup";

interface TransactionConfirmationContextType {
  showTransactionConfirmation: (
    transaction: TransactionDetails
  ) => Promise<boolean>;
  isConfirmationOpen: boolean;
  currentTransaction: TransactionDetails | null;
  isLoading: boolean;
}

const TransactionConfirmationContext = createContext<
  TransactionConfirmationContextType | undefined
>(undefined);

interface TransactionConfirmationProviderProps {
  children: ReactNode;
}

export const TransactionConfirmationProvider: React.FC<
  TransactionConfirmationProviderProps
> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<TransactionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const showTransactionConfirmation = useCallback(
    (transaction: TransactionDetails): Promise<boolean> => {
      return new Promise((resolve) => {
        setCurrentTransaction(transaction);
        setIsOpen(true);
        setResolvePromise(() => resolve);
      });
    },
    []
  );

  const handleConfirm = useCallback(() => {
    setIsLoading(true);
    if (resolvePromise) {
      resolvePromise(true);
    }
    setIsOpen(false);
    setCurrentTransaction(null);
    setResolvePromise(null);
    setIsLoading(false);
  }, [resolvePromise]);

  const handleReject = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(false);
    }
    setIsOpen(false);
    setCurrentTransaction(null);
    setResolvePromise(null);
    setIsLoading(false);
  }, [resolvePromise]);

  const value: TransactionConfirmationContextType = {
    showTransactionConfirmation,
    isConfirmationOpen: isOpen,
    currentTransaction,
    isLoading,
  };

  return (
    <TransactionConfirmationContext.Provider value={value}>
      {children}
      <TransactionConfirmationPopup
        isOpen={isOpen}
        transaction={currentTransaction}
        onConfirm={handleConfirm}
        onReject={handleReject}
        isLoading={isLoading}
      />
    </TransactionConfirmationContext.Provider>
  );
};

export const useTransactionConfirmation = () => {
  const context = useContext(TransactionConfirmationContext);
  if (context === undefined) {
    throw new Error(
      "useTransactionConfirmation must be used within a TransactionConfirmationProvider"
    );
  }
  return context;
}; 