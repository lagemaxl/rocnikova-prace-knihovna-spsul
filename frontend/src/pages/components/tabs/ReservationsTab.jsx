import React, { useEffect, useState } from "react";
import pb from "../../../lib/pocketbase";
import { Button, Modal, Skeleton } from "@mantine/core";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useNavigate } from "react-router-dom";

function ReservationsTab() {
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isDeleteReservationModalOpen, setIsDeleteReservationModalOpen] =
    useState(false);
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (pb.authStore.isValid && pb.authStore.model.role === "admin") {
          setLoadingReservations(true);
          const reservationsResponse = await pb
            .collection("reservations_show")
            .getList(1, 50);
          const formattedReservations = reservationsResponse.items.map(
            (item) => ({
              id: item.id,
              created: item.created,
              user_email: item.user_email,
              book_name: item.book_name,
              ready: item.ready,
            })
          );
          setReservations(formattedReservations);
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoadingReservations(false);
      }
    };

    fetchData();
  }, [navigate]);

  const deleteReservation = async () => {
    if (!selectedReservation) return;
    try {
      await pb.collection("reservations").delete(selectedReservation.id);
      setReservations(
        reservations.filter((res) => res.id !== selectedReservation.id)
      );
      setIsDeleteReservationModalOpen(false);
    } catch (error) {
      console.error("Failed to delete reservation", error);
    }
  };

  const markAsReady = async (reservation) => {
    try {
      await pb
        .collection("reservations")
        .update(reservation.id, { ready: true });
      setReservations(
        reservations.map((res) =>
          res.id === reservation.id ? { ...res, ready: true } : res
        )
      );
    } catch (error) {
      console.error("Chyba při označení jako připravené:", error);
    }
  };

  const renderReservationActions = (rowData) => (
    <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
      <Button
        color="var(--danger)"
        size="xs"
        onClick={() => {
          setSelectedReservation(rowData);
          setIsDeleteReservationModalOpen(true);
        }}
      >
        Smazat
      </Button>
      <Button
        color="var(--success)"
        size="xs"
        disabled={rowData.ready}
        onClick={() => markAsReady(rowData)}
      >
        {rowData.ready ? "Připraveno" : "Označit jako připravené"}
      </Button>
    </div>
  );

  return (
    <div>
      <h2>Rezervace</h2>

      {loadingReservations ? (
        <Skeleton height={200} />
      ) : (
        <DataTable
          value={reservations}
          responsiveLayout="scroll"
          emptyMessage="Žádné rezervace k vyřízení"
          rowClassName={(rowData) => (rowData.ready ? "ready-row" : "")}
        >
          <Column
            field="created"
            header="Datum vytvoření"
            body={(rowData) => formatDate(rowData.created)}
          />
          <Column field="user_email" header="Email" />
          <Column field="book_name" header="Název knihy" />
          <Column
            field="ready"
            header="Stav"
            body={(rowData) =>
              rowData.ready ? "Připraveno" : "Čeká na vyřízení"
            }
          />
          <Column header="Akce" body={renderReservationActions} />
        </DataTable>
      )}

      <Modal
        opened={isDeleteReservationModalOpen}
        onClose={() => setIsDeleteReservationModalOpen(false)}
        title="Smazat rezervaci"
      >
        <p>Opravdu si přejete tuto rezervaci smazat?</p>
        <Button
          color="var(--danger)"
          onClick={deleteReservation}
          style={{ marginRight: "1rem" }}
        >
          Smazat
        </Button>
        <Button
          variant="light"
          color="var(--danger)"
          onClick={() => setIsDeleteReservationModalOpen(false)}
        >
          Zrušit
        </Button>
      </Modal>
    </div>
  );
}

export default ReservationsTab;
