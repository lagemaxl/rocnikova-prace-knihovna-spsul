import React from "react";
import { useEffect, useState } from "react";
import pb from "../../../lib/pocketbase";
import { Button, Modal, Textarea, Switch, Skeleton } from "@mantine/core";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { IconLink } from "@tabler/icons-react";

function RequirementsTab() {
  const [showDone, setShowDone] = useState(false);
  const [requirements, setRequirements] = useState([]);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [loadingRequirements, setLoadingRequirements] = useState(true);
  const [isDoneModalOpen, setIsDoneModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [note, setNote] = useState("");

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
  };

  useEffect(() => {
    const fetchRequirementsEffect = async () => {
      await fetchRequirements();
    };

    fetchRequirementsEffect();
  }, [showDone]);

  const fetchRequirements = async () => {
    deleteRequirement;
    try {
      setLoadingRequirements(true);
      const filter = showDone ? "true" : "false";
      const requirementsResponse = await pb
        .collection("requirements_show")
        .getFullList({ filter: `done=${filter}` });
      setRequirements(requirementsResponse);
      setLoadingRequirements(false);
    } catch (error) {
      console.error("Failed to fetch requirements", error);
      setLoadingRequirements(false);
    }
  };

  const deleteRequirement = async () => {
    if (!selectedRequirement) return;

    try {
      await pb.collection("requirements").delete(selectedRequirement.id);
      setRequirements(
        requirements.filter((req) => req.id !== selectedRequirement.id)
      );
      setNotification({
        message: "Požadavek byl úspěšně smazán",
        color: "green",
      });
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Failed to delete requirement", error);
      setNotification({
        message: "Nepodařilo se smazat požadavek",
        color: "red",
      });
    }
  };

  const markAsDone = async () => {
    if (!selectedRequirement) return;

    const updatedData = {
      ...selectedRequirement,
      done: true,
      note,
    };

    try {
      await pb
        .collection("requirements")
        .update(selectedRequirement.id, updatedData);
      setRequirements(
        requirements.map((req) =>
          req.id === selectedRequirement.id ? updatedData : req
        )
      );
      setNotification({
        message: "Požadavek byl označen jako vyřízený",
        color: "green",
      });
      setIsDoneModalOpen(false);
      setNote("");
    } catch (error) {
      console.error("Failed to mark requirement as done", error);
      setNotification({
        message: "Nepodařilo se označit požadavek jako vyřízený",
        color: "red",
      });
    }
  };

  const renderActions = (rowData) => {
    return (
      <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
        <Button
          color="var(--danger)"
          size="xs"
          onClick={() => {
            setSelectedRequirement(rowData);
            setIsDeleteModalOpen(true);
          }}
        >
          Smazat
        </Button>
        <Button
          color="var(--success)"
          size="xs"
          onClick={() => {
            setSelectedRequirement(rowData);
            setIsDoneModalOpen(true);
          }}
        >
          Označit jako vyřízený
        </Button>
      </div>
    );
  };

  return (
    <div>
      <h2>Požadavky</h2>
      <div>
        <Switch
          checked={showDone}
          onChange={() => setShowDone(!showDone)}
          label={showDone ? "Zobrazit nevyřízené" : "Zobrazit vyřízené"}
          style={{ marginBottom: "1rem" }}
        />
        {loadingRequirements ? (
          <Skeleton height={200} />
        ) : (
          <DataTable
            value={requirements}
            responsiveLayout="scroll"
            emptyMessage="Žádné požadavky k vyřízení"
          >
            <Column
              field="created"
              header="Datum vytvoření"
              body={(rowData) => formatDate(rowData.created)}
            />
            <Column field="username" header="Uživatel" />
            <Column field="request" header="Žádost" />
            <Column
              field="link"
              header="Odkaz"
              body={(rowData) =>
                rowData.link ? (
                  <a
                    href={rowData.link}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    <IconLink size={16} style={{ marginLeft: "0.5rem" }} />
                  </a>
                ) : null
              }
            />
            {showDone ? (
              <Column field="note" header="Poznámka" />
            ) : (
              <Column
                header="Akce"
                style={{ display: "flex", justifyContent: "center" }}
                body={renderActions}
              />
            )}
          </DataTable>
        )}
      </div>

      <Modal
        opened={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Smazat požadavek"
      >
        <p>Opravdu si přejete tento požadavek smazat?</p>
        <Button
          color="var(--danger)"
          onClick={() => {
            deleteRequirement();
            setIsDeleteModalOpen(false);
          }}
          style={{ marginRight: "1rem" }}
        >
          Smazat
        </Button>

        <Button
          variant="light"
          color="var(--danger)"
          onClick={() => setIsDeleteModalOpen(false)}
        >
          Zrušit
        </Button>
      </Modal>

      <Modal
        opened={isDoneModalOpen}
        onClose={() => setIsDoneModalOpen(false)}
        title="Označit jako vyřízený"
      >
        <Textarea
          placeholder="Zadejte poznámku"
          value={note}
          onChange={(event) => setNote(event.currentTarget.value)}
        />
        <Button
          onClick={markAsDone}
          color="var(--success)"
          style={{ marginTop: "1rem" }}
        >
          Uložit
        </Button>
      </Modal>
    </div>
  );
}

export default RequirementsTab;
