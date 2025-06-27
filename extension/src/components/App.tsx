import React, { useState } from 'react';
import { useWallet } from './WalletProvider';
import SetupScreen from './SetupScreen';
import ImportScreen from './ImportScreen';
import GeneratedWalletScreen from './GeneratedWalletScreen';
import WalletScreen from './WalletScreen';
import SendScreen from './SendScreen';
import LoadingScreen from './LoadingScreen';
import PasswordSetupScreen from './PasswordSetupScreen';
import PasswordUnlockScreen from './PasswordUnlockScreen';

const App: React.FC = () => {
  const { wallet, isLoading, isPasswordSet, generateWallet, importWallet, unlockWallet } = useWallet();
  const [currentScreen, setCurrentScreen] = useState<'setup' | 'password-setup' | 'import' | 'generated' | 'wallet' | 'send' | 'unlock'>('setup');
  const [generatedWalletData, setGeneratedWalletData] = useState<{
    privateKey: string;
    address: string;
  } | null>(null);
  const [pendingPassword, setPendingPassword] = useState<string>('');

  // Set initial screen based on wallet state
  React.useEffect(() => {
    if (!isLoading) {
      if (wallet) {
        setCurrentScreen('wallet');
      } else if (isPasswordSet) {
        setCurrentScreen('unlock');
      } else {
        setCurrentScreen('setup');
      }
    }
  }, [isLoading, wallet, isPasswordSet]);

  const handleGenerateWallet = async (password: string) => {
    try {
      // Generate a new wallet directly
      const { ethers } = await import('ethers');
      const newWallet = ethers.Wallet.createRandom();
      
      // Store the wallet data for display
      setGeneratedWalletData({
        privateKey: newWallet.privateKey,
        address: newWallet.address
      });
      
      // Call the provider's generateWallet to store it encrypted
      await generateWallet(password);
      
      setCurrentScreen('generated');
    } catch (error) {
      console.error('Error generating wallet:', error);
      alert('Error generating wallet: ' + (error as Error).message);
    }
  };

  const handleImportWallet = async (privateKey: string, password: string) => {
    try {
      await importWallet(privateKey, password);
      setCurrentScreen('wallet');
    } catch (error) {
      console.error('Error importing wallet:', error);
      alert('Error importing wallet: ' + (error as Error).message);
    }
  };

  const handlePasswordSet = async (password: string) => {
    try {
      await handleGenerateWallet(password);
    } catch (error) {
      console.error('Error setting password:', error);
      setCurrentScreen('setup');
    }
  };

  const handleUnlock = async (password: string) => {
    const success = await unlockWallet(password);
    if (success) {
      setCurrentScreen('wallet');
    } else {
      alert('Invalid password. Please try again.');
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  // If wallet is loaded, show wallet screens
  if (wallet) {
    switch (currentScreen) {
      case 'wallet':
        return <WalletScreen 
          onSendEth={() => setCurrentScreen('send')} 
          onCreateNewWallet={() => setCurrentScreen('password-setup')}
        />;
      case 'send':
        return <SendScreen onBack={() => setCurrentScreen('wallet')} />;
      default:
        return <WalletScreen 
          onSendEth={() => setCurrentScreen('send')} 
          onCreateNewWallet={() => setCurrentScreen('password-setup')}
        />;
    }
  }

  // If password is set but no wallet is loaded, show unlock screen
  if (isPasswordSet && !wallet) {
    return <PasswordUnlockScreen onUnlock={handleUnlock} />;
  }

  // If no password is set, show setup screen
  if (!isPasswordSet) {
    switch (currentScreen) {
      case 'setup':
        return (
          <SetupScreen
            onGenerateWallet={() => setCurrentScreen('password-setup')}
            onImportWallet={() => setCurrentScreen('import')}
          />
        );
      case 'password-setup':
        return (
          <PasswordSetupScreen
            onPasswordSet={handlePasswordSet}
            onBack={() => setCurrentScreen('setup')}
          />
        );
      case 'import':
        return (
          <ImportScreen 
            onBack={() => setCurrentScreen('setup')}
            onImport={(privateKey, password) => handleImportWallet(privateKey, password)}
          />
        );
      case 'generated':
        return (
          <GeneratedWalletScreen 
            walletData={generatedWalletData}
            onContinue={() => setCurrentScreen('wallet')} 
          />
        );
      default:
        return (
          <SetupScreen
            onGenerateWallet={() => setCurrentScreen('password-setup')}
            onImportWallet={() => setCurrentScreen('import')}
          />
        );
    }
  }

  // Default fallback
  return (
    <SetupScreen
      onGenerateWallet={() => setCurrentScreen('password-setup')}
      onImportWallet={() => setCurrentScreen('import')}
    />
  );
};

export default App; 