import { Modal, Text, Group, Button } from "@mantine/core";
import React from "react";

const ExtendModal = ({
  opened,
  onClose,
  onConfirm,
  selectedBorrow,
  daysToExtend,
}) => {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Prodloužit vypůjčku"
    >
      <Text>
        Skutečně chcete uživateli <strong>{selectedBorrow?.user_email}</strong> prodloužit výpůjčku knihy <strong>{selectedBorrow?.book_name}</strong> o <strong>{daysToExtend}</strong> dní?
      </Text>
      <Group position="right" mt="md">
        <Button color="var(--danger)" onClick={onClose}>Zrušit</Button>
        <Button color="var(--success)" onClick={onConfirm}>Ano</Button>
      </Group>
    </Modal>
  );
};

export default React.memo(ExtendModal);
