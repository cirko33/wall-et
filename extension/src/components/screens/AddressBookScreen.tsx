import React, { useEffect, useState } from "react";
import {
  getAddressBook,
  addToAddressBook,
  removeFromAddressBook,
} from "../../utils/addressBookStorage";

interface AddressBookScreenProps {
  onBack: () => void;
}

const AddressBookScreen: React.FC<AddressBookScreenProps> = ({ onBack }) => {
  const [addresses, setAddresses] = useState<
    { address: string; name: string }[]
  >([]);
  const [newEntry, setNewEntry] = useState({ address: "", name: "" });
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    refreshAddressBook();
  }, []);

  const refreshAddressBook = () => {
    const book = getAddressBook();
    setAddresses(
      Object.entries(book).map(([address, name]) => ({
        address,
        name: String(name),
      }))
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEntry((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const { address, name } = newEntry;
    if (!address || !name) {
      setError("Both address and name are required.");
      return;
    }
    addToAddressBook(address.trim(), name.trim());
    setNewEntry({ address: "", name: "" });
    refreshAddressBook();
  };

  const handleEdit = (address: string, name: string) => {
    setEditing(address);
    setEditName(name);
  };

  const handleEditSave = (address: string) => {
    if (!editName.trim()) return;
    addToAddressBook(address, editName.trim());
    setEditing(null);
    setEditName("");
    refreshAddressBook();
  };

  const handleEditCancel = () => {
    setEditing(null);
    setEditName("");
  };

  const handleRemove = (address: string) => {
    removeFromAddressBook(address);
    refreshAddressBook();
  };

  return (
    <div className="screen">
      <div className="token-content">
        <h2>Address Book</h2>
        <form onSubmit={handleAdd}>
          <div className="form-group margin-bottom-0">
            <label htmlFor="recipient-address">Recipient Address:</label>
            <input
              type="text"
              id="recipient-address"
              name="address"
              className="input"
              placeholder="Recipient Address"
              value={newEntry.address}
              onChange={handleInputChange}
            />
            <label htmlFor="recipient-name" className="margin-top-8">
              Name:
            </label>
            <input
              type="text"
              id="recipient-name"
              name="name"
              className="input"
              placeholder="Name"
              value={newEntry.name}
              onChange={handleInputChange}
            />
          </div>
          {error && <div className="warning margin-top-4">{error}</div>}
          <div className="button-group margin-top-12">
            <button className="btn btn-primary" type="submit">
              Add Recipient
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={onBack}
            >
              Back
            </button>
          </div>
        </form>
        <div className="margin-top-24">
          {addresses.length === 0 ? (
            <div>No addresses in address book.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {addresses.map(({ address, name }) => (
                <div
                  key={address}
                  onClick={() => {
                    if (editing !== address) handleEdit(address, name);
                  }}
                  className="flex-align-center-gap-10 bg-1976d2 border-radius-16 padding-10-20 box-shadow-1px-4px border-2px-transparent position-relative min-height-48 transition-bg-shadow"
                  style={{
                    cursor: editing !== address ? "pointer" : "default",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      minWidth: 0,
                      gap: 2,
                      overflow: "hidden",
                    }}
                  >
                    <span className="font-bold-16 ellipsis" title={address}>
                      {address}
                    </span>
                    {editing === address ? (
                      <div className="flex-align-center-gap-4 width-100">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="font-size-14 padding-2-4 border-radius-6 bg-1565c0 color-fff border-1-5px-64b5f6 margin-right-2 flex-1 min-width-0 max-width-160px"
                        />
                      </div>
                    ) : (
                      <span className="color-bbdefb ellipsis" title={name}>
                        {name}
                      </span>
                    )}
                  </div>
                  {editing === address && (
                    <div className="flex-align-center-gap-4">
                      <button
                        className="btn btn-primary font-size-12 padding-2-4 min-width-48"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditSave(address);
                        }}
                        type="button"
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-secondary cancel-btn font-size-12 padding-2-4 min-width-48"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCancel();
                        }}
                        type="button"
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-secondary delete-btn font-size-12 padding-2-4 min-width-48"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(address);
                        }}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressBookScreen;
