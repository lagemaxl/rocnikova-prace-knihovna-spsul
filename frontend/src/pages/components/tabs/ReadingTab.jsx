import React from "react";
import { useEffect, useState } from "react";
import { Modal, TextInput, Button, Skeleton, Select } from "@mantine/core";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import pb from "../../../lib/pocketbase";

function ReadingTab() {
  const [readingList, setReadingList] = useState([]);
  const [loadingReadingList, setLoadingReadingList] = useState(true);
  const [selectedReadingItem, setSelectedReadingItem] = useState(null);
  const [isEditReadingModalOpen, setIsEditReadingModalOpen] = useState(false);

  useEffect(() => {
    const fetchReadingList = async () => {
      try {
        setLoadingReadingList(true);
        const records = await pb
          .collection("graduation_reading_list")
          .getFullList({
            sort: "id",
          });
        setReadingList(records);
      } catch (error) {
        console.error("Chyba při načítání maturitní četby", error);
      } finally {
        setLoadingReadingList(false);
      }
    };

    fetchReadingList();
  }, []);

  const openEditReadingModal = (item) => {
    setSelectedReadingItem(item);
    setIsEditReadingModalOpen(true);
  };

  const handleSaveReadingItem = async (updatedData) => {
    try {
      await pb
        .collection("graduation_reading_list")
        .update(updatedData.id, updatedData);
      setReadingList(
        readingList.map((r) => (r.id === updatedData.id ? updatedData : r))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsEditReadingModalOpen(false);
    }
  };

  return (
    <div>
      <h2>Maturitní četba</h2>
      {loadingReadingList ? (
        <Skeleton height={200} />
      ) : (
        <DataTable
          value={readingList}
          responsiveLayout="scroll"
          emptyMessage="Žádné záznamy"
        >
          <Column field="id" header="Číso" />
          <Column field="book_name" header="Název knihy" />
          <Column field="author_name" header="Autor" />
          <Column field="type" header="Období" />
          <Column field="form" header="Forma" />
          <Column field="recommended_year" header="Rok vydání" />
          <Column
            header="Akce"
            body={(rowData) => (
              <Button
                size="xs"
                color="var(--secondary)"
                onClick={() => openEditReadingModal(rowData)}
              >
                Upravit
              </Button>
            )}
          />
        </DataTable>
      )}
      <EditReadingModal
        opened={isEditReadingModalOpen}
        onClose={() => setIsEditReadingModalOpen(false)}
        data={selectedReadingItem}
        onSave={handleSaveReadingItem}
      />
    </div>
  );
}

const PERIOD_OPTIONS = [
  "Světová a česká literatura do konce 18. století",
  "Světová a česká literatura 19. století",
  "Světová literatura 20. a 21. století",
  "Česká literatura 20. a 21. století",
];

const FORM_OPTIONS = ["próza", "poezie", "drama"];
const EditReadingModal = ({ opened, onClose, data, onSave }) => {
  const [form, setForm] = useState({
    book_name: "",
    author_name: "",
    type: "",
    form: "",
    recommended_year: "",
  });

  useEffect(() => {
    if (opened && data) {
      setForm({
        book_name: data.book_name || "",
        author_name: data.author_name || "",
        type: data.type || "",
        form: data.form || "",
        recommended_year: data.recommended_year || "",
      });
    }
  }, [opened, data]);

  const handleSave = () => {
    onSave({ ...data, ...form });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Upravit četbu">
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <TextInput
          label="Název knihy"
          value={form.book_name}
          onChange={(e) =>
            setForm((f) => ({ ...f, book_name: e.target.value }))
          }
        />
        <TextInput
          label="Autor"
          value={form.author_name}
          onChange={(e) =>
            setForm((f) => ({ ...f, author_name: e.target.value }))
          }
        />
        <Select
          label="Období"
          data={PERIOD_OPTIONS}
          value={form.type}
          onChange={(value) => setForm((f) => ({ ...f, type: value }))}
          placeholder="Vyberte období"
        />
        <Select
          label="Forma"
          data={FORM_OPTIONS}
          value={form.form}
          onChange={(value) => setForm((f) => ({ ...f, form: value }))}
          placeholder="Vyberte formu"
        />
        <TextInput
          label="Doporučený rok vydání"
          type="number"
          value={form.recommended_year}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              recommended_year: parseInt(e.target.value) || 0,
            }))
          }
        />
        <Button
          onClick={handleSave}
          color="var(--success)"
          style={{ marginTop: "1rem" }}
        >
          Uložit
        </Button>
      </div>
    </Modal>
  );
};

export default ReadingTab;
