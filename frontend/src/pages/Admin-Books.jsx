import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  TextInput,
  NumberInput,
  Autocomplete,
  FileInput,
  Notification,
  Input,
  Loader,
  ScrollArea,
  ColorInput,
  Modal,
  MultiSelect,
  SimpleGrid,
} from "@mantine/core";
import pb from "../lib/pocketbase";
import "./style/Admin.css";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { space } from "postcss/lib/list";

const AdminBooks = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [authorInputs, setAuthorInputs] = useState([""]);
  const [publisherInput, setPublisherInput] = useState("");
  const [newTagModal, setNewTagModal] = useState({
    open: false,
    name: "",
    color: "#000000",
  });
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState([]);
  const [notification, setNotification] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState(null);
  const [borrows, setBorrows] = useState({});
  const [formData, setFormData] = useState({
    id: null,
    name: "",
    authors: [],
    publisher: "",
    year: "",
    isbn: "",
    count: 1,
    image: null,
    tags: [],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEntityModal, setNewEntityModal] = useState({
    open: false,
    type: "",
    name: "",
  });

  const handleAddEntity = async () => {
    try {
      const data = { name: newEntityModal.name };
      let record;
      if (newEntityModal.type === "author") {
        record = await pb.collection("authors").create(data);
        setAuthors((prev) => [...prev, record]);
        setAuthorInputs((prev) => [...prev.slice(0, -1), record.name]);
      } else if (newEntityModal.type === "publisher") {
        record = await pb.collection("publishers").create(data);
        setPublishers((prev) => [...prev, record]);
        setPublisherInput(record.name);
      }
      setNewEntityModal({ open: false, type: "", name: "" });
      showNotification(
        `Úspěšně přidán ${
          newEntityModal.type === "author" ? "autor" : "nakladatelství"
        }`,
        "green"
      );
    } catch (error) {
      showNotification("Chyba při přidávání záznamu", "red");
    }
  };

  const fetchBorrows = async (bookId) => {
    try {
      const borrowsData = await pb
        .collection("borrows_show")
        .getFullList({ filter: `book_id="${bookId}"` });
      setBorrows((prev) => ({ [bookId]: borrowsData, ...prev }));
    } catch (error) {
      showNotification("Error fetching borrows", "red");
    }
  };

  const rowExpansionTemplate = (data) => {
    const bookBorrows = borrows[data.id] || [];

    const formatDate = (dateString) => {
      if (!dateString) return "-";
      const date = new Date(dateString);
      return date.toLocaleString("cs-CZ", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return (
      <div>
        <h5>Výpůjčky pro knihu: {data.name}</h5>
        {bookBorrows.length > 0 ? (
          <DataTable value={bookBorrows} size="small">
            <Column field="username" header="Uživatel" />
            <Column field="user_email" header="Email" />
            <Column
              field="from_date"
              header="Od data"
              body={(row) => formatDate(row.from_date)}
            />
            <Column
              field="to_date"
              header="Do data"
              body={(row) => formatDate(row.to_date)}
            />
            <Column
              field="return"
              header="Vráceno"
              body={(row) => (row.return ? "Ano" : "Ne")}
            />
            <Column field="note" header="Poznámka" />
          </DataTable>
        ) : (
          <p>Žádné výpůjčky pro tuto knihu.</p>
        )}
      </div>
    );
  };

  const onRowToggle = async (e) => {
    setExpandedRows(e.data);
    const bookId = e.data?.[0]?.id;
    if (bookId && !borrows[bookId]) {
      await fetchBorrows(bookId);
    }
  };

  useEffect(() => {
    if (pb.authStore.isValid && pb.authStore.model.role) {
      if (pb.authStore.model.role === "admin") {
        fetchAuthorsAndPublishers();
        fetchBooks();
        fetchTags();
      } else {
        navigate("/");
      }
    } else {
      navigate("/");
    }
  }, [navigate]);

  const fetchAuthorsAndPublishers = async () => {
    try {
      const authorsData = await pb.collection("authors").getFullList({});
      const publishersData = await pb.collection("publishers").getFullList({});
      setAuthors(authorsData);
      setPublishers(publishersData);
    } catch (error) {
      showNotification("Error fetching authors or publishers", "red");
    }
  };

  const fetchBooks = async () => {
    try {
      const booksData = await pb.collection("books").getFullList({});
      setBooks(booksData);
      setLoading(false);
    } catch (error) {
      showNotification("Error fetching books", "red");
    }
  };

  const fetchTags = async () => {
    try {
      const tagsData = await pb.collection("tags").getFullList({});
      setTags(tagsData);
    } catch (error) {
      showNotification("Chyba při načítání tagů", "red");
    }
  };

  const showNotification = (message, color) => {
    setNotification({ message, color });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const authorIds = authorInputs
      .map((name) => authors.find((author) => author.name === name)?.id)
      .filter((id) => id);

    const publisherId = publishers.find(
      (publisher) => publisher.name === publisherInput
    )?.id;

    const data = {
      ...formData,
      authors: authorIds,
      publisher: publisherId,
      tags: tagInput,
    };

    try {
      if (formData.id) {
        //update
        await pb.collection("books").update(formData.id, data);
        showNotification("Kniha byla úspěšně aktualizována", "green");
      } else {
        //create
        await pb.collection("books").create(data);
        showNotification("Kniha byla úspěšně vytvořena", "green");
      }

      fetchBooks();
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      showNotification("Chyba při ukládání knihy", "red");
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      name: "",
      authors: [],
      publisher: "",
      year: "",
      isbn: "",
      count: 1,
      image: null,
      tags: [],
    });
    setTagInput([]);
    setAuthorInputs([""]);
    setPublisherInput("");
  };

  const handleAddTag = async () => {
    try {
      const data = {
        name: newTagModal.name,
        color: newTagModal.color,
      };
      const record = await pb.collection("tags").create(data);
      setTags((prev) => [...prev, record]);
      showNotification("Tag úspěšně přidán", "green");
      setNewTagModal({ open: false, name: "", color: "#000000" });
    } catch (error) {
      showNotification("Chyba při přidávání tagu", "red");
    }
  };

  const handleDeleteTag = async (tagId) => {
    try {
      await pb.collection("tags").delete(tagId);
      setTags((prev) => prev.filter((tag) => tag.id !== tagId));
      showNotification("Tag úspěšně smazán", "green");
    } catch (error) {
      showNotification("Chyba při mazání tagu", "red");
    }
  };

  const handleRowClick = (book) => {
    setFormData({
      id: book.id,
      collectionId: book.collectionId,
      name: book.name,
      authors: book.authors,
      publisher: book.publisher,
      year: book.year,
      isbn: book.isbn,
      count: book.count,
      image: book.image,
    });

    const authorNames = book.authors.map(
      (id) => authors.find((author) => author.id === id)?.name || ""
    );
    setAuthorInputs(authorNames);
    const publisherName =
      publishers.find((publisher) => publisher.id === book.publisher)?.name ||
      "";
    setPublisherInput(publisherName);

    const tagIds = book.tags || [];
    setTagInput(tagIds);

    setIsModalOpen(true);
  };

  const filteredBooks = books.filter((book) =>
    book.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getImageSrc = (book) => {
    const src =
      book.image === ""
        ? "https://placehold.co/500x700.jpg"
        : `${import.meta.env.VITE_API_URL}api/files/${book.collectionId}/${
            book.id
          }/${book.image}`;
    return src;
  };

  const imageTemplate = (rowData) => (
    <img
      src={getImageSrc(rowData)}
      alt={rowData.name}
      style={{ width: "50px", height: "70px", objectFit: "cover" }}
    />
  );

  if (loading) {
    return (
      <div className="loading-container">
        <Loader color="orange" size="xl" className="loading" />
      </div>
    );
  }

  return (
    <>
      <div className="table-container">
        <div className="borrows-header">
          <Input
            mt="md"
            variant="filled"
            radius="xl"
            placeholder="Vyhledávání knih"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
          />
          <Button color="var(--secondary)" onClick={() => setIsModalOpen(true)}>
            Přidat novou knihu
          </Button>
        </div>
        <DataTable
          value={filteredBooks}
          paginator
          rows={10}
          rowsPerPageOptions={[10, 25, 50]}
          scrollable
          scrollHeight="flex"
          selectionMode="single"
          emptyMessage="Nebyla nalezena žádná data."
          onRowSelect={(e) => handleRowClick(e.data)}
          onRowToggle={onRowToggle}
          expandedRows={expandedRows}
          rowExpansionTemplate={rowExpansionTemplate}
          size="small"
        >
          <Column expander style={{ width: "3em" }} />
          <Column field="name" sortable header="Název"></Column>
          <Column field="image" header="Obrázek" body={imageTemplate}></Column>
          <Column
            header="Autoři"
            sortable
            body={(rowData) =>
              rowData.authors
                .map(
                  (id) => authors.find((author) => author.id === id)?.name || ""
                )
                .join(", ")
            }
          />
          <Column
            header="Nakladatelství"
            sortable
            body={(rowData) =>
              publishers.find((publisher) => publisher.id === rowData.publisher)
                ?.name || ""
            }
          />
          <Column
            header="Tagy"
            body={(rowData) =>
              rowData.tags
                .map((id) => tags.find((tag) => tag.id === id)?.name || "")
                .join(", ")
            }
          />
          <Column field="year" sortable header="Rok"></Column>
          <Column field="isbn" header="ISBN"></Column>
          <Column field="count" sortable header="Počet"></Column>
        </DataTable>
      </div>

      <Modal
        opened={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={formData.id ? "Aktualizovat knihu" : "Vytvořit knihu"}
        size="xl"
      >
        <SimpleGrid cols={2}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyItems: "center",
              alignItems: "space-between",
              gap: "10px",
            }}
          >
            <img
              src={getImageSrc(formData)}
              alt={formData.name}
              style={{ width: "50%", objectFit: "cover" }}
            />
            <FileInput
              label="Obrázek knihy"
              onChange={(file) => setFormData({ ...formData, image: file })}
            />
            <MultiSelect
              label="Tagy"
              data={tags.map((tag) => ({
                value: tag.id,
                label: tag.name,
              }))}
              value={tagInput}
              onChange={setTagInput}
              placeholder="Vyberte tagy"
              searchable
              nothingFound="Žádné tagy nenalezeny"
            />
            <Button
              mt="sm"
              size="xs"
              color="var(--secondary)"
              onClick={() =>
                setNewTagModal({ open: true, name: "", color: "#000000" })
              }
            >
              Spravovat tagy
            </Button>
          </div>
          <form onSubmit={handleSubmit}>
            <TextInput
              label="Název knihy"
              value={formData.name}
              onChange={(event) =>
                setFormData({ ...formData, name: event.currentTarget.value })
              }
              required
            />
            {authorInputs.map((authorInput, index) => {
              const foundAuthor = authors.some(
                (author) => author.name === authorInput
              );
              return (
                <div key={index} className="div-authors">
                  <Autocomplete
                    label={`Autor ${index + 1}`}
                    data={authors.map((author) => author.name)}
                    value={authorInput}
                    onChange={(value) => {
                      const updated = [...authorInputs];
                      updated[index] = value;
                      setAuthorInputs(updated);
                    }}
                  />
                  <div className="icons-authors">
                    {!foundAuthor && authorInput && (
                      <IconPlus
                        color="black"
                        stroke={1}
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          setNewEntityModal({
                            open: true,
                            type: "author",
                            name: authorInput,
                          })
                        }
                      />
                    )}
                    {index > 0 && (
                      <IconTrash
                        color="red"
                        stroke={1}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          const updated = authorInputs.filter(
                            (_, i) => i !== index
                          );
                          setAuthorInputs(updated);
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            <Button
              size="xs"
              mt="sm"
              mb="sm"
              onClick={() => setAuthorInputs([...authorInputs, ""])}
              color="var(--secondary)"
            >
              Přidat dalšího autora
            </Button>
            <br />
            <div>
              <Autocomplete
                label="Nakladatelství"
                data={publishers.map((publisher) => publisher.name)}
                value={publisherInput}
                onChange={setPublisherInput}
              />
              {!publishers.some(
                (publisher) => publisher.name === publisherInput
              ) &&
                publisherInput && (
                  <Button
                    size="xs"
                    color="var(--secondary)"
                    mt="xs"
                    onClick={() =>
                      setNewEntityModal({
                        open: true,
                        type: "publisher",
                        name: publisherInput,
                      })
                    }
                  >
                    Přidat nakladatelství
                  </Button>
                )}
            </div>

            <NumberInput
              label="Rok vydání"
              value={formData.year}
              onChange={(value) => setFormData({ ...formData, year: value })}
            />
            <NumberInput
              label="Počet"
              value={formData.count}
              onChange={(value) => setFormData({ ...formData, count: value })}
            />
            <TextInput
              label="ISBN"
              value={formData.isbn}
              onChange={(event) =>
                setFormData({ ...formData, isbn: event.currentTarget.value })
              }
            />
            <Button type="submit" mt="md" color="var(--secondary)">
              {formData.id ? "Aktualizovat" : "Vytvořit"}
            </Button>
          </form>
        </SimpleGrid>
      </Modal>

      <Modal
        opened={newTagModal.open}
        color="var(--secondary)"
        onClose={() =>
          setNewTagModal({ open: false, name: "", color: "#000000" })
        }
        title="Spravovat tagy"
      >
        <div>
          <TextInput
            label="Název tagu"
            value={newTagModal.name}
            required
            onChange={(e) =>
              setNewTagModal({ ...newTagModal, name: e.currentTarget.value })
            }
          />
          <ColorInput
            label="Barva tagu"
            value={newTagModal.color}
            required
            onChange={(value) =>
              setNewTagModal({ ...newTagModal, color: value })
            }
          />
          <Button mt="sm" color="var(--secondary)" onClick={handleAddTag}>
            Přidat tag
          </Button>
        </div>
        <ScrollArea
          style={{ maxHeight: 200 }}
          mt="md"
          mb="md"
          shadow="xs"
          noScrollX
        >
          {tags.map((tag) => (
            <div
              key={tag.id}
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "5px",
              }}
            >
              <div style={{ flexGrow: 1 }}>{tag.name}</div>
              <Button
                size="xs"
                color="red"
                onClick={() => handleDeleteTag(tag.id)}
              >
                Smazat
              </Button>
            </div>
          ))}
        </ScrollArea>
      </Modal>

      <Modal
        opened={newEntityModal.open}
        onClose={() => setNewEntityModal({ open: false, type: "", name: "" })}
        title={`Přidat ${
          newEntityModal.type === "author" ? "autora" : "nakladatelství"
        }`}
      >
        <p>
          Skutečně si přejete přidat{" "}
          {newEntityModal.type === "author" ? "autora" : "nakladatelství"}:{" "}
          <strong>{newEntityModal.name}</strong>?
        </p>
        <Button color="green" onClick={handleAddEntity} mt="md" mr="md">
          Ano
        </Button>
        <Button
          color="red"
          onClick={() => setNewEntityModal({ open: false, type: "", name: "" })}
          mt="md"
        >
          Ne
        </Button>
      </Modal>

      {notification && (
        <Notification
          color={notification.color}
          onClose={() => setNotification(null)}
        >
          {notification.message}
        </Notification>
      )}
    </>
  );
};

export default AdminBooks;
