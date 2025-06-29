const TOKEN_ADDRESS_BOOK_KEY = "tokenAddressBook";

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
}

export type TokenAddressBook = Record<string, TokenInfo>;

const addToTokenAddressBook = (
  address: string,
  name: string,
  symbol: string,
  decimals: number
) => {
  const tokenAddressBook = getTokenAddressBook();
  tokenAddressBook[address] = { name, symbol, decimals };
  localStorage.setItem(
    TOKEN_ADDRESS_BOOK_KEY,
    JSON.stringify(tokenAddressBook)
  );
};

const getTokenAddressBook = (): TokenAddressBook => {
  const tokenAddressBook = localStorage.getItem(TOKEN_ADDRESS_BOOK_KEY);
  return tokenAddressBook
    ? (JSON.parse(tokenAddressBook) as TokenAddressBook)
    : {};
};

const removeFromTokenAddressBook = (address: string) => {
  const tokenAddressBook = getTokenAddressBook();
  delete tokenAddressBook[address];
  localStorage.setItem(
    TOKEN_ADDRESS_BOOK_KEY,
    JSON.stringify(tokenAddressBook)
  );
};

export {
  addToTokenAddressBook,
  getTokenAddressBook,
  removeFromTokenAddressBook,
};
