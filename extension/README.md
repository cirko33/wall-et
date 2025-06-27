# WALL-ET Extension

A secure Ethereum wallet extension for the Sepolia testnet, built with modern web technologies and best security practices.

## Features

- 🔐 **Secure Private Key Management**: Generate new wallets or import existing ones
- 💰 **Send ETH**: Transfer Sepolia testnet ETH to any address
- 📊 **Real-time Balance**: View your current ETH balance
- 🔄 **Transaction History**: Track your recent transactions
- 🎨 **Modern UI**: Clean, responsive design with intuitive navigation
- 🔒 **Local Storage**: Private keys stored securely in browser storage

## Installation

### For Development

1. **Clone or download this extension**
2. **Open Chrome/Edge/Brave browser**
3. **Navigate to Extensions**:

   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`
   - Brave: `brave://extensions/`

4. **Enable Developer Mode** (toggle in top-right corner)

5. **Load Extension**:

   - Click "Load unpacked"
   - Select the `extension` folder from this project

6. **Pin the Extension**:
   - Click the puzzle piece icon in your browser toolbar
   - Find "WALL-ET" and click the pin icon

## Usage

### First Time Setup

1. **Click the extension icon** in your browser toolbar
2. **Choose setup option**:
   - **Generate New Wallet**: Creates a new wallet with a random private key
   - **Import Existing Wallet**: Import using an existing private key

### Generate New Wallet

1. Click "Generate New Wallet"
2. **IMPORTANT**: Save your private key securely - you won't see it again!
3. Copy both the private key and address
4. Click "Continue to Wallet"

### Import Existing Wallet

1. Click "Import Existing Wallet"
2. Enter your 64-character private key (without 0x prefix)
3. Click "Import"
4. Your wallet will be loaded and ready to use

### Send ETH

1. In the main wallet screen, click "Send ETH"
2. Enter the recipient address (must be a valid Ethereum address)
3. Enter the amount of ETH to send
4. Set gas price (default: 20 Gwei)
5. Review the transaction summary
6. Click "Send Transaction"
7. Wait for confirmation

### Security Features

- **Local Storage**: Private keys are stored locally in your browser
- **No Server Communication**: All operations happen client-side
- **Secure Validation**: Input validation for addresses and amounts
- **Transaction Confirmation**: All transactions require explicit confirmation

## Technical Details

### Network Configuration

- **Network**: Sepolia Testnet
- **RPC Endpoint**: Infura Sepolia (public endpoint)
- **Chain ID**: 11155111

### Dependencies

- **ethers.js v5.7.2**: Ethereum library for wallet operations
- **Chrome Extension APIs**: For storage and background processing

### File Structure

```
extension/
├── manifest.json          # Extension configuration
├── popup.html            # Main UI
├── styles.css            # Styling
├── wallet.js             # Core wallet functionality
├── background.js         # Background service worker
└── README.md            # This file
```

## Development

### Prerequisites

- Modern web browser (Chrome, Edge, Brave)
- Basic knowledge of Ethereum and blockchain concepts

### Local Development

1. Make changes to the code
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

### Testing

- Use Sepolia testnet faucets to get test ETH
- Test with small amounts first
- Verify transactions on [Sepolia Etherscan](https://sepolia.etherscan.io/)

## Security Considerations

⚠️ **Important Security Notes**:

1. **Private Key Security**: Never share your private key with anyone
2. **Testnet Only**: This wallet is for Sepolia testnet only
3. **Local Storage**: Keys are stored in browser storage - secure your device
4. **No Recovery**: There's no password recovery - keep your private key safe
5. **Browser Security**: Ensure your browser is up to date and secure

## Troubleshooting

### Common Issues

**Extension won't load**:

- Ensure Developer Mode is enabled
- Check that all files are in the correct directory
- Verify manifest.json syntax

**Can't send transactions**:

- Check your Sepolia ETH balance
- Verify recipient address format
- Ensure sufficient gas for transaction

**Balance not updating**:

- Click the "Refresh" button
- Check your internet connection
- Verify you're connected to Sepolia testnet

### Getting Test ETH

To get Sepolia testnet ETH for testing:

1. **Sepolia Faucet**: https://sepoliafaucet.com/
2. **Alchemy Faucet**: https://sepoliafaucet.com/
3. **Infura Faucet**: https://www.infura.io/faucet/sepolia

## Contributing

This is a basic implementation. Potential improvements:

- Add transaction history with Etherscan API
- Implement address book functionality
- Add support for other networks
- Improve UI/UX design
- Add more security features
- Implement backup/restore functionality

## License

This project is for educational purposes. Use at your own risk.

## Disclaimer

This wallet extension is for educational and testing purposes only. Do not use for storing real funds. Always use official, audited wallet software for real cryptocurrency transactions.
