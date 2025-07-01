export type AddressBook = Record<string, string>;
const ADDRESS_BOOK_KEY = "addressBook";

const getAddressBook = () => {
  const addressBook = localStorage.getItem(ADDRESS_BOOK_KEY);
  return addressBook ? JSON.parse(addressBook) : {};
};

const addToAddressBook = (address: string, name: string) => {
  const addressBook = getAddressBook();
  addressBook[address] = name;
  localStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify(addressBook));
};

const removeFromAddressBook = (address: string) => {
  const addressBook = getAddressBook();
  delete addressBook[address];
  localStorage.setItem(ADDRESS_BOOK_KEY, JSON.stringify(addressBook));
};

export { getAddressBook, addToAddressBook, removeFromAddressBook };
