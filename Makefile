PHONY: build-contracts
build-contracts:
	cd contracts && forge build
	cd ..

PHONY: build-extension
build-extension:
	cd extension && npm run build 
	cd ..

PHONY: dev
dev:
	cd extension && npm run dev
	cd ..

PHONY: build
build: 
	make build-contracts
	for i in contracts/src/*.sol; do \
		name=$$(basename $$i .sol); \
		echo $$name; \
		cp contracts/out/$$name.sol/$$name.json extension/contracts/$$name.json; \
	done
	make build-extension

PHONY: deploy-contract
deploy-contract:
	cd contracts && forge create $(CONTRACT_NAME) \
		--broadcast \
		--rpc-url https://sepolia.infura.io/v3/7a796da878ac4152a6b3bfcb4fc794cb \
		--private-key $(PRIVATE_KEY) --constructor-args $(CONSTRUCTOR_ARGS) \

PHONY: deploy-contract
deploy-contract-without-params:
	cd contracts && forge create $(CONTRACT_NAME) \
		--broadcast \
		--rpc-url https://sepolia.infura.io/v3/7a796da878ac4152a6b3bfcb4fc794cb \
		--private-key $(PRIVATE_KEY) 

PHONY: mint
mint:
	cd contracts && cast send --rpc-url https://sepolia.infura.io/v3/7a796da878ac4152a6b3bfcb4fc794cb \
		--private-key $(PRIVATE_KEY) \
		$(CONTRACT_ADDRESS) "function mint(address,uint256)(bool)" $(ADDRESS) $(AMOUNT) 

PHONY: erc20-balance
erc20-balance:
	cd contracts && cast call --rpc-url https://sepolia.infura.io/v3/7a796da878ac4152a6b3bfcb4fc794cb \
	 $(CONTRACT_ADDRESS) "function balanceOf(address)(uint256)" $(ADDRESS)

propose:
	cd contracts && cast send $(MULTISIG_CONTRACT_ADDRESS) "function propose(address,uint256)(bytes32)" 0x1234567890123456789012345678901234567890 100000000000000000 --private-key $(PRIVATE_KEY) --rpc-url https://sepolia.infura.io/v3/7a796da878ac4152a6b3bfcb4fc794cb

get-transaction:
	cd contracts && cast call $(MULTISIG_CONTRACT_ADDRESS) "function getTransaction(bytes32)(bytes32,address,uint256,uint256)" $(TX_HASH) --private-key $(PRIVATE_KEY) --rpc-url https://sepolia.infura.io/v3/7a796da878ac4152a6b3bfcb4fc794cb

# export PRIVATE_KEY="0x1258da7fcb1cdf38756793019d647be1e901d813926a20436633de1ae66c1f32"
# export CONTRACT_NAME="MultiSig"
# export CONTRACT_NAME="Approver"
# export CONSTRUCTOR_ARGS="["0x67B4aEBD440DaF118d3dBc44fB4E2dD8007F7e06","0xA8C3233edDd1b3bceD4b6EA7a0FB575cC4beA097"] 1"
# export $=0x67B4aEBD440DaF118d3dBc44fB4E2dD8007F7e06
#export MULTISIG_CONTRACT_ADDRESS=0xF33Aa7FF517012CA0A66eeE79897a653FB2E3c44
# export TX_HASH=0xf3ae18bd9d513f69b5d29f0159c8c43dd9045927916d61328c5f4f75cfa9eedd

# DUMMY_APPROVER_CONTRACT_ADDRESS=0xE32dE7601aD6375bca489fCA49E5fa4F00688ee3