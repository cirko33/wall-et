const MULTISIG_KEY = "multisigContracts";

export function getMultisigContracts(): string[] {
  const data = localStorage.getItem(MULTISIG_KEY);
  return data ? JSON.parse(data) : [];
}

export function addMultisigContract(address: string) {
  const contracts = getMultisigContracts();
  if (!contracts.includes(address)) {
    contracts.push(address);
    localStorage.setItem(MULTISIG_KEY, JSON.stringify(contracts));
  }
}

export function getMultisigTxs(address: string): string[] {
  const key = `multisigTxs:${address}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

export function addMultisigTx(address: string, txHash: string) {
  const key = `multisigTxs:${address}`;
  const txs = getMultisigTxs(address);
  if (!txs.includes(txHash)) {
    txs.push(txHash);
    localStorage.setItem(key, JSON.stringify(txs));
  }
}
