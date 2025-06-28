PHONY: build-contracts
build-contracts:
	cd contracts && forge build
	cd ..

PHONY: build-extension
build-extension:
	cd extension && npm run build 
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
		--rpc-url https://sepolia.infura.io/v3/7a796da878ac4152a6b3bfcb4fc794cb \
		--private-key $(PRIVATE_KEY) $(CONSTRUCTOR_ARGS === "" ? "" : --constructor-args $(CONSTRUCTOR_ARGS)) \
		--broadcast

PHONY: mint
mint:
	cd contracts && cast send --rpc-url https://sepolia.infura.io/v3/7a796da878ac4152a6b3bfcb4fc794cb \
		--private-key $(PRIVATE_KEY) \
		$(CONTRACT_ADDRESS) "function mint(address,uint256)(bool)" $(TO) $(AMOUNT) 

PHONY: erc20-balance
erc20-balance:
	cd contracts && cast call --rpc-url https://sepolia.infura.io/v3/7a796da878ac4152a6b3bfcb4fc794cb \
	 $(CONTRACT_ADDRESS) "function balanceOf(address)(uint256)" $(ADDRESS)