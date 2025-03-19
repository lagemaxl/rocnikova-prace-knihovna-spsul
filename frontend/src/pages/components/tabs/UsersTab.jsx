import React, { useState, useEffect } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button, Modal, Select, TextInput, Notification } from "@mantine/core";
import pb from "../../../lib/pocketbase";

const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Notifikační e-mail
  const [notificationEmail, setNotificationEmail] = useState("");
  const [tempEmail, setTempEmail] = useState("");
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchNotificationEmail();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const records = await pb
        .collection("users")
        .getFullList({ sort: "-created" });
      setUsers(records);
    } catch (error) {
      console.error("Chyba při načítání uživatelů:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationEmail = async () => {
    try {
      const record = await pb.collection("notification_mail").getOne("1");
      setNotificationEmail(record.email || "");
    } catch (error) {
      console.error("Chyba při načítání notifikačního emailu:", error);
    }
  };

  const updateNotificationEmail = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(tempEmail)) {
      setEmailError("Neplatný formát e-mailu.");
      return;
    }
    try {
      const data = { email: tempEmail };
      await pb.collection("notification_mail").update("1", data);
      setNotificationEmail(tempEmail); // aktualizuj zobrazený e-mail až po úspěšném uložení
      setEmailModalOpen(false);
      setEmailError("");
    } catch (error) {
      console.error("Chyba při ukládání emailu:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("cs-CZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setEditModalOpen(true);
  };

  const openEmailModal = () => {
    setTempEmail(notificationEmail);
    setEmailModalOpen(true);
  };

  const deleteUser = async () => {
    if (!selectedUser) return;
    try {
      await pb.collection("users").delete(selectedUser.id);
      setUsers(users.filter((u) => u.id !== selectedUser.id));
    } catch (error) {
      console.error("Chyba při mazání uživatele:", error);
    } finally {
      setDeleteModalOpen(false);
    }
  };

  const updateUserRole = async () => {
    if (!selectedUser) return;
    try {
      const updatedData = { ...selectedUser, role: newRole };
      await pb.collection("users").update(selectedUser.id, updatedData);
      setUsers(
        users.map((user) => (user.id === selectedUser.id ? updatedData : user))
      );
    } catch (error) {
      console.error("Chyba při úpravě uživatele:", error);
    } finally {
      setEditModalOpen(false);
    }
  };

  return (
    <div>
      <h2>Správa uživatelů</h2>

      <div style={{ marginBottom: "1rem" }}>
        <strong>Notifikační e-mail:</strong> {notificationEmail || "nenastaven"}
        <Button
          size="xs"
          variant="light"
          color="var(--secondary)"
          onClick={openEmailModal}
          style={{ marginLeft: "1rem" }}
        >
          Upravit e-mail
        </Button>
      </div>

      <DataTable
        value={users}
        loading={loading}
        paginator
        rows={50}
        responsiveLayout="scroll"
        emptyMessage="Žádní uživatelé"
      >
        <Column field="email" header="E-mail" />
        <Column field="role" header="Role" />
        <Column
          field="created"
          header="Registrován"
          body={(rowData) => formatDate(rowData.created)}
        />
        <Column
          header="Akce"
          body={(rowData) => (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button
                size="xs"
                color="var(--secondary)"
                variant="light"
                onClick={() => openEditModal(rowData)}
              >
                Upravit roli
              </Button>
              <Button
                size="xs"
                color="var(--danger)"
                onClick={() => openDeleteModal(rowData)}
              >
                Smazat
              </Button>
            </div>
          )}
        />
      </DataTable>

      {/* Modál - Mazání uživatele */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Smazat uživatele"
      >
        <p>
          Opravdu chcete smazat uživatele{" "}
          <strong>{selectedUser?.username}</strong>?
        </p>
        <Button
          color="var(--danger)"
          onClick={deleteUser}
          style={{ marginRight: "1rem" }}
        >
          Smazat
        </Button>
        <Button
          color="var(--danger)"
          variant="light"
          onClick={() => setDeleteModalOpen(false)}
        >
          Zrušit
        </Button>
      </Modal>

      {/* Modál - Úprava role */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Upravit roli uživatele"
      >
        <Select
          label="Role uživatele"
          data={[
            { value: "teacher", label: "Učitel" },
            { value: "admin", label: "Admin" },
          ]}
          value={newRole}
          onChange={setNewRole}
        />
        <Button
          color="var(--success)"
          onClick={updateUserRole}
          style={{ marginTop: "1rem" }}
        >
          Uložit změny
        </Button>
      </Modal>

      {emailModalOpen && (
        <NotificationEmailModal
          opened={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          tempEmail={tempEmail}
          setTempEmail={setTempEmail}
          emailError={emailError}
          onSave={updateNotificationEmail}
        />
      )}
    </div>
  );
};

const NotificationEmailModal = ({
  opened,
  onClose,
  tempEmail,
  setTempEmail,
  emailError,
  onSave,
}) => {
  return (
    <Modal opened={opened} onClose={onClose} title="Upravit notifikační e-mail">
      <TextInput
        label="E-mail"
        value={tempEmail}
        onChange={(e) => setTempEmail(e.currentTarget.value)}
        error={emailError}
        placeholder="např. admin@example.com"
      />

      <Button color="blue" onClick={onSave} style={{ marginTop: "1rem" }}>
        Uložit e-mail
      </Button>
    </Modal>
  );
};

export default UsersTab;
