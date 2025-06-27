class SepoliaWallet {
    constructor() {
        this.provider = null;
        this.wallet = null;
        this.currentScreen = 'setup';
        this.transactions = [];
        
        this.init();
    }

    async init() {
        // Initialize ethers provider for Sepolia testnet
        this.provider = new ethers.providers.JsonRpcProvider(
            'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
        );

        // Check if wallet exists in storage
        const storedWallet = await this.getStoredWallet();
        if (storedWallet) {
            this.wallet = new ethers.Wallet(storedWallet.privateKey, this.provider);
            this.showScreen('wallet');
            this.updateWalletInfo();
        } else {
            this.showScreen('setup');
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Setup screen
        document.getElementById('generate-wallet').addEventListener('click', () => {
            this.generateNewWallet();
        });

        document.getElementById('import-wallet').addEventListener('click', () => {
            this.showScreen('import');
        });

        // Import screen
        document.getElementById('confirm-import').addEventListener('click', () => {
            this.importWallet();
        });

        document.getElementById('back-to-setup').addEventListener('click', () => {
            this.showScreen('setup');
        });

        document.getElementById('show-private-key').addEventListener('click', () => {
            this.togglePrivateKeyVisibility();
        });

        // Generated wallet screen
        document.getElementById('copy-private-key').addEventListener('click', () => {
            this.copyToClipboard('generated-private-key');
        });

        document.getElementById('copy-address').addEventListener('click', () => {
            this.copyToClipboard('generated-address');
        });

        document.getElementById('continue-to-wallet').addEventListener('click', () => {
            this.showScreen('wallet');
            this.updateWalletInfo();
        });

        // Main wallet screen
        document.getElementById('copy-wallet-address').addEventListener('click', () => {
            this.copyToClipboard('wallet-address');
        });

        document.getElementById('refresh-balance').addEventListener('click', () => {
            this.updateWalletInfo();
        });

        document.getElementById('send-eth').addEventListener('click', () => {
            this.showScreen('send');
        });

        // Send screen
        document.getElementById('confirm-send').addEventListener('click', () => {
            this.sendTransaction();
        });

        document.getElementById('back-to-wallet').addEventListener('click', () => {
            this.showScreen('wallet');
        });

        // Real-time calculations for send screen
        document.getElementById('eth-amount').addEventListener('input', () => {
            this.calculateTransactionFee();
        });

        document.getElementById('gas-price').addEventListener('input', () => {
            this.calculateTransactionFee();
        });
    }

    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });

        // Show target screen
        document.getElementById(`${screenName}-screen`).classList.remove('hidden');
        this.currentScreen = screenName;
    }

    showLoading(message = 'Processing...') {
        document.getElementById('loading-message').textContent = message;
        this.showScreen('loading');
    }

    hideLoading() {
        this.showScreen(this.currentScreen);
    }

    async generateNewWallet() {
        try {
            this.showLoading('Generating new wallet...');
            
            // Generate a new random wallet
            const newWallet = ethers.Wallet.createRandom();
            
            // Store the wallet securely
            await this.storeWallet(newWallet.privateKey);
            
            // Set the wallet instance
            this.wallet = newWallet.connect(this.provider);
            
            // Display the generated wallet info
            document.getElementById('generated-private-key').value = newWallet.privateKey;
            document.getElementById('generated-address').value = newWallet.address;
            
            this.hideLoading();
            this.showScreen('generated-wallet');
            
        } catch (error) {
            console.error('Error generating wallet:', error);
            this.hideLoading();
            alert('Error generating wallet: ' + error.message);
        }
    }

    async importWallet() {
        const privateKeyInput = document.getElementById('private-key-input');
        const privateKey = privateKeyInput.value.trim();

        if (!privateKey) {
            alert('Please enter a private key');
            return;
        }

        try {
            this.showLoading('Importing wallet...');

            // Validate private key format
            if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
                throw new Error('Invalid private key format. Please enter a 64-character hexadecimal string.');
            }

            // Create wallet instance to validate
            const wallet = new ethers.Wallet(privateKey, this.provider);
            
            // Store the wallet securely
            await this.storeWallet(privateKey);
            
            this.wallet = wallet;
            this.hideLoading();
            this.showScreen('wallet');
            this.updateWalletInfo();
            
        } catch (error) {
            console.error('Error importing wallet:', error);
            this.hideLoading();
            alert('Error importing wallet: ' + error.message);
        }
    }

    togglePrivateKeyVisibility() {
        const input = document.getElementById('private-key-input');
        const button = document.getElementById('show-private-key');
        
        if (input.type === 'password') {
            input.type = 'text';
            button.textContent = '🙈';
        } else {
            input.type = 'password';
            button.textContent = '👁️';
        }
    }

    async updateWalletInfo() {
        if (!this.wallet) return;

        try {
            // Update address
            document.getElementById('wallet-address').value = this.wallet.address;
            
            // Update balance
            const balance = await this.wallet.getBalance();
            const ethBalance = ethers.utils.formatEther(balance);
            document.getElementById('eth-balance').textContent = parseFloat(ethBalance).toFixed(6);
            
            // Load transaction history
            await this.loadTransactionHistory();
            
        } catch (error) {
            console.error('Error updating wallet info:', error);
            alert('Error updating wallet info: ' + error.message);
        }
    }

    async loadTransactionHistory() {
        try {
            // For now, we'll show a simple message
            // In a real implementation, you'd fetch from Etherscan API
            const transactionsList = document.getElementById('transactions-list');
            transactionsList.innerHTML = '<div class="no-transactions">No transactions yet</div>';
            
        } catch (error) {
            console.error('Error loading transaction history:', error);
        }
    }

    calculateTransactionFee() {
        const amount = parseFloat(document.getElementById('eth-amount').value) || 0;
        const gasPrice = parseInt(document.getElementById('gas-price').value) || 20;
        
        // Standard gas limit for ETH transfer
        const gasLimit = 21000;
        const gasPriceWei = ethers.utils.parseUnits(gasPrice.toString(), 'gwei');
        const feeWei = gasLimit * gasPriceWei;
        const feeEth = ethers.utils.formatEther(feeWei);
        
        document.getElementById('estimated-fee').textContent = parseFloat(feeEth).toFixed(6) + ' ETH';
        document.getElementById('total-amount').textContent = (amount + parseFloat(feeEth)).toFixed(6) + ' ETH';
    }

    async sendTransaction() {
        const recipientAddress = document.getElementById('recipient-address').value.trim();
        const amount = parseFloat(document.getElementById('eth-amount').value);
        const gasPrice = parseInt(document.getElementById('gas-price').value);

        if (!recipientAddress || !amount || !gasPrice) {
            alert('Please fill in all fields');
            return;
        }

        if (!ethers.utils.isAddress(recipientAddress)) {
            alert('Invalid recipient address');
            return;
        }

        if (amount <= 0) {
            alert('Amount must be greater than 0');
            return;
        }

        try {
            this.showLoading('Sending transaction...');

            const amountWei = ethers.utils.parseEther(amount.toString());
            const gasPriceWei = ethers.utils.parseUnits(gasPrice.toString(), 'gwei');
            
            // Create transaction object
            const tx = {
                to: recipientAddress,
                value: amountWei,
                gasPrice: gasPriceWei,
                gasLimit: 21000
            };

            // Send transaction
            const transaction = await this.wallet.sendTransaction(tx);
            
            this.showLoading('Waiting for confirmation...');
            
            // Wait for transaction to be mined
            const receipt = await transaction.wait();
            
            this.hideLoading();
            this.showScreen('wallet');
            
            alert(`Transaction successful!\nHash: ${receipt.transactionHash}`);
            
            // Update wallet info
            this.updateWalletInfo();
            
        } catch (error) {
            console.error('Error sending transaction:', error);
            this.hideLoading();
            alert('Error sending transaction: ' + error.message);
        }
    }

    async copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        const text = element.value;
        
        try {
            await navigator.clipboard.writeText(text);
            alert('Copied to clipboard!');
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            // Fallback for older browsers
            element.select();
            document.execCommand('copy');
            alert('Copied to clipboard!');
        }
    }

    // Secure storage methods
    async storeWallet(privateKey) {
        try {
            // In a real implementation, you'd use more secure storage
            // For now, we'll use chrome.storage.local
            const walletData = {
                privateKey: privateKey,
                timestamp: Date.now()
            };
            
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({ wallet: walletData });
            } else {
                // Fallback to localStorage (less secure, but works for demo)
                localStorage.setItem('sepolia_wallet', JSON.stringify(walletData));
            }
        } catch (error) {
            console.error('Error storing wallet:', error);
            throw error;
        }
    }

    async getStoredWallet() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get(['wallet']);
                return result.wallet;
            } else {
                // Fallback to localStorage
                const stored = localStorage.getItem('sepolia_wallet');
                return stored ? JSON.parse(stored) : null;
            }
        } catch (error) {
            console.error('Error retrieving stored wallet:', error);
            return null;
        }
    }

    async clearStoredWallet() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.remove(['wallet']);
            } else {
                localStorage.removeItem('sepolia_wallet');
            }
        } catch (error) {
            console.error('Error clearing stored wallet:', error);
        }
    }
}

// Initialize the wallet when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SepoliaWallet();
}); 