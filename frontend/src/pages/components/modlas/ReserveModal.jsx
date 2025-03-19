import React from "react";
import { Modal, Text, Group, Button } from "@mantine/core";
import pb from "../../../lib/pocketbase";

const ReserveModal = ({ opened, onClose, selectedBorrow }) => {
  const handleMarkReady = async () => {
    try {
      const reservations = await pb.collection("reservations_show").getFullList({
        filter: `book="${selectedBorrow.book_id}" && active=true && ready=false`,
        sort: "created", // nejstarší první
      });

      if (reservations.length > 0) {
        const reservationToUpdate = reservations[0];
        await pb.collection("reservations").update(reservationToUpdate.id, {
          ready: true,
        });
        onClose();
      }
    } catch (error) {
      console.error("Chyba při označení rezervace jako připravené:", error);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Rezervace knihy">
      <Text>
        Tato kniha je zarezervovaná. Chcete označit rezervaci jako připravenou k vyzvednutí?
      </Text>
      <Group position="right" mt="md">
        <Button color="var(--danger)" onClick={onClose}>Zavřít</Button>
        <Button color="var(--success)" onClick={handleMarkReady}>Označit jako připravenou</Button>
      </Group>
    </Modal>
  );
};

export default React.memo(ReserveModal);
