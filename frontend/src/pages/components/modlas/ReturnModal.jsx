import { Modal, Text, TextInput, Group, Button } from "@mantine/core";
import React, { useState, useEffect } from "react";

const ReturnModal = ({ opened, onClose, onConfirm, selectedBorrow }) => {
  const [localNote, setLocalNote] = useState("");

  useEffect(() => {
    if (opened) setLocalNote(""); // reset poznámky při otevření modalu
  }, [opened]);

  const handleSubmit = () => {
    onConfirm(localNote); // předáme poznámku zpět rodiči
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Potvrzení vrácení knih"
    >
      <Text>
        Skutečně uživatel <strong>{selectedBorrow?.user_email}</strong> vrátil knihy?
      </Text>
      {selectedBorrow && (
        <ul>
          <li>{selectedBorrow.book_name} ({selectedBorrow.book_count})</li>
        </ul>
      )}
      <TextInput
        label="Poznámka"
        placeholder="Zadejte poznámku k vrácení (volitelné)"
        value={localNote}
        onChange={(e) => setLocalNote(e.currentTarget.value)}
      />
      <Group position="right" mt="md">
        <Button color="var(--danger)" onClick={onClose}>Ne</Button>
        <Button color="var(--success)" onClick={handleSubmit}>Ano</Button>
      </Group>
    </Modal>
  );
};

export default React.memo(ReturnModal);
