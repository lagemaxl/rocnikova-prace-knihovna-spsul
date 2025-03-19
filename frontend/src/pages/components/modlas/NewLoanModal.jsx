import React from "react";
import {
  Modal,
  Autocomplete,
  Button,
  NumberInput,
  Group,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";

const NewLoanModal = ({
  opened,
  onClose,
  users,
  books,
  newLoanData,
  newLoanErrors,
  selectedUser,
  setSelectedUser,
  setNewLoanData,
  setOpenedNewUserModal,
  handleNewLoanSubmit,
}) => {
  return (
    <Modal opened={opened} onClose={onClose} title="Nová vypůjčka">
      {users && (
        <Autocomplete
          label="Uživatel"
          placeholder="Vyberte uživatele podle emailu"
          data={users.map((user) => ({
            value: user.id,
            label: user.email || "Neznámý uživatel",
          }))}
          onChange={(value) => {
            const selected = users.find((user) => user.email === value);
            setSelectedUser(selected || null);
            setNewLoanData({ ...newLoanData, user: selected?.id || "" });
          }}
          error={newLoanErrors.user}
        />
      )}
      <Button
        color="var(--secondary)"
        onClick={() => setOpenedNewUserModal(true)}
        mt="sm"
      >
        Přidat nového uživatele
      </Button>
      {books && (
        <Autocomplete
          w="100%"
          label="Kniha"
          placeholder="Vyberte knihu podle názvu"
          data={books.map((book) => ({
            value: book.id,
            label: book.name || "Neznámá kniha",
          }))}
          value={newLoanData.book.name}
          onChange={(value) => {
            const selected = books.find((book) => book.name === value);
            setNewLoanData({ ...newLoanData, book: selected?.id || "" });
          }}
          error={newLoanErrors.book}
        />
      )}
      <NumberInput
        w="100%"
        label="Počet"
        placeholder="Počet"
        type="number"
        value={newLoanData.count}
        onChange={(value) =>
          setNewLoanData({ ...newLoanData, count: value || 1 })
        }
        defaultValue={1}
        error={newLoanErrors.count}
      />
      <DatePickerInput
        label="Od"
        value={newLoanData.from_date}
        onChange={(date) => setNewLoanData({ ...newLoanData, from_date: date })}
        error={newLoanErrors.from_date}
      />
      <DatePickerInput
        label="Do"
        value={newLoanData.to_date}
        onChange={(date) => setNewLoanData({ ...newLoanData, to_date: date })}
        error={newLoanErrors.to_date}
      />

      <Group position="right" mt="md">
        <Button color="var(--danger)" onClick={onClose}>
          Zrušit
        </Button>
        <Button color="var(--success)" onClick={handleNewLoanSubmit}>
          Vytvořit
        </Button>
      </Group>
    </Modal>
  );
};

export default NewLoanModal;
