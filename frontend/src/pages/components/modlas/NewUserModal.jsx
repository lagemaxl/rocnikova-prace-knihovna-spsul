import React, { useEffect, useState } from "react";
import { Modal, TextInput, Group, Button } from "@mantine/core";

const NewUserModal = ({ opened, onClose, newUserErrors, onSubmit }) => {
  const [tempUser, setTempUser] = useState({ email: "" });

  useEffect(() => {
    if (opened) {
      setTempUser({ email: "" }); // reset při každém otevření modalu
    }
  }, [opened]);

  const handleSubmit = () => {
    onSubmit(tempUser); // pošleme pouze hotový objekt
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Přidat nového uživatele">
      <TextInput
        label="E-mail uživatele"
        placeholder="Zadejte e-mail uživatele"
        value={tempUser.email}
        onChange={(e) =>
          setTempUser({ ...tempUser, email: e.currentTarget.value })
        }
        error={newUserErrors.email}
      />

      <Group position="right" mt="md">
        <Button color="var(--danger)" onClick={onClose}>Zrušit</Button>
        <Button color="var(--success)" onClick={handleSubmit}>Přidat</Button>
      </Group>
    </Modal>
  );
};

export default React.memo(NewUserModal);
