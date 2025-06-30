# WALL-ET Ethereum Wallet Extension

<img src=".assets/wall-et.png" width=300 />

A secure Ethereum wallet extension for Brave browser with Sepolia testnet support.

## Features

- 🔐 **Secure Local Storage**: Private keys stored locally in browser storage
- 🆕 **Wallet Generation**: Create new Ethereum wallets with random private keys
- 📥 **Import Existing**: Import wallets using private keys
- 💸 **Send Transactions**: Send ETH transactions on Sepolia testnet
- 🎨 **Modern UI**: Beautiful, responsive interface
- 🔒 **Privacy Focused**: No data sent to external servers

## Installation

### For Brave Browser

1. **Download the Extension**

   - Clone or download this repository
   - Ensure all files are in the same directory

2. **Load Extension in Brave**

   - Open Brave browser
   - Go to `brave://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the folder containing the extension files

3. **Verify Installation**
   - The WALL-E icon should appear in your browser toolbar
   - Click the icon to open the wallet

## Usage

### First Time Setup

1. **Choose Your Option**

   - **Import Private Key**: If you have an existing wallet
   - **Generate New Wallet**: To create a fresh wallet

2. **For New Wallets**

   - Click "Generate New Wallet"
   - **IMPORTANT**: Save your private key securely - you won't see it again!
   - Copy both address and private key to a secure location

3. **For Existing Wallets**
   - Click "Import Private Key"
   - Enter your 64-character private key (with or without 0x prefix)

### Sending Transactions

1. **Get Sepolia ETH**

   - Visit [Sepolia Faucet](https://sepoliafaucet.com/) to get test ETH
   - Or use [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)

2. **Send Transaction**
   - Enter recipient address
   - Specify amount in ETH
   - Set gas price (default: 20 Gwei)
   - Click "Send Transaction"

## Security Notes

⚠️ **Important Security Warnings**:

- This is a **testnet wallet** - only use with Sepolia testnet
- Private keys are stored **unencrypted** in browser storage
- **Never** use this for mainnet or real funds
- Always backup your private key securely
- This extension is for educational/demo purposes

## File Structure

```
wall-e/
├── manifest.json          # Extension configuration
├── popup.html            # Main wallet interface
├── popup.js              # Wallet functionality
├── styles.css            # UI styling
├── background.js         # Background service worker
├── content.js            # Content script
├── ethers.min.js         # Ethereum library
├── icons/                # Extension icons
└── README.md             # This file
```

## Development

### Prerequisites

- Brave browser
- Basic knowledge of Ethereum and browser extensions

### Customization

- Modify `styles.css` for UI changes
- Update `popup.js` for wallet functionality
- Edit `manifest.json` for permissions and settings

### Testing

- Use Sepolia testnet for all transactions
- Test with small amounts first
- Verify transactions on [Sepolia Etherscan](https://sepolia.etherscan.io/)

## Troubleshooting

### Common Issues

1. **Extension won't load**

   - Ensure all files are present
   - Check browser console for errors
   - Verify manifest.json syntax

2. **Transactions fail**

   - Check Sepolia network connection
   - Ensure sufficient test ETH balance
   - Verify recipient address format

3. **Private key import fails**
   - Ensure 64-character hexadecimal format
   - Add 0x prefix if missing
   - Check for extra spaces or characters

### Getting Help

- Check browser console for error messages
- Verify network connectivity
- Ensure you're using Sepolia testnet addresses

## License

This project is for educational purposes. Use at your own risk.

## Disclaimer

This extension is provided as-is for educational and testing purposes. It is not intended for production use or handling real funds. Always use proper security measures when dealing with cryptocurrency wallets.
