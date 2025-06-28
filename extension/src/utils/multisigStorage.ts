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
