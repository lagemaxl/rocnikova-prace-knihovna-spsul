import React, { useState, useEffect } from "react";
import {
  Table,
  ScrollArea,
  Button,
  Modal,
  Text,
  Group,
  Select,
  NumberInput,
  Autocomplete,
  TextInput,
  Checkbox,
  Loader,
  Badge,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import "@mantine/dates/styles.css";
import pb from "../lib/pocketbase";
import "./style/Admin-Borrows.css";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

import ReturnModal from "./components/modlas/ReturnModal";
import ExtendModal from "./components/modlas/ExtendModal";
import NewLoanModal from "./components/modlas/NewLoanModal";
import NewUserModal from "./components/modlas/NewUserModal";
import ReserveModal from "./components/modlas/ReserveModal";

const removeDiacritics = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const AdminBorrows = () => {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openedReturnModal, setOpenedReturnModal] = useState(false);
  const [openedExtendModal, setOpenedExtendModal] = useState(false);
  const [openedNewLoanModal, setOpenedNewLoanModal] = useState(false);
  const [openedNewUserModal, setOpenedNewUserModal] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [newLoanData, setNewLoanData] = useState({
    user: "",
    book: "",
    count: 1,
    from_date: new Date(),
    to_date: new Date(new Date().setMonth(new Date().getMonth() + 2)),
  });
  const [newLoanErrors, setNewLoanErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    emailVisibility: true,
    verified: false,
    passwordConfirm: "pass",
    password: "pass",
  });
  const [newUserErrors, setNewUserErrors] = useState({});
  const [filter, setFilter] = useState("all");
  const [showReturned, setShowReturned] = useState(false);
  const [daysToExtend, setDaysToExtend] = useState(14);
  const [returnNote, setReturnNote] = useState("");
  const [openedReserveModal, setopenedReserveModal] = useState(false);
  let daysAlert = 3;

  useEffect(() => {
    const fetchBorrows = async () => {
      const borrowsData = await pb.collection("borrows_show").getFullList({
        sort: "-to_date",
      });
      setBorrows(borrowsData);
      setLoading(false);
    };

    const fetchUsers = async () => {
      const usersData = await pb
        .collection("users")
        .getFullList({ sort: "email" });
      setUsers(usersData);
    };

    const fetchBooks = async () => {
      const booksData = await pb
        .collection("books")
        .getFullList({ sort: "name" });
      setBooks(booksData);
    };

    fetchBorrows();
    fetchUsers();
    fetchBooks();
  }, []);

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleReturnClick = (borrow) => {
    setSelectedBorrow(borrow);
    setOpenedReturnModal(true);
  };

  const handleExtendClick = (borrow) => {
    setSelectedBorrow(borrow);
    setOpenedExtendModal(true);
  };

  const handleConfirmReturn = async (note = "") => {
    if (selectedBorrow) {
      const currentDate = new Date().toISOString();

      const reservations = await pb
        .collection("reservations_show")
        .getFullList({
          filter: `book="${selectedBorrow.book_id}" && active=true`,
        });

      if (reservations.length > 0) {
        setopenedReserveModal(true);
      }

      const data = {
        ...selectedBorrow,
        return: true,
        to_date: currentDate,
        note: note,
      };

      await pb.collection("borrows").update(selectedBorrow.id, data);

      const updatedBorrows = borrows.map((borrow) =>
        borrow.id === selectedBorrow.id
          ? { ...borrow, return: true, to_date: currentDate, note: note }
          : borrow
      );

      setBorrows(updatedBorrows);
      setOpenedReturnModal(false);
    }
  };

  const handleConfirmExtension = async () => {
    if (selectedBorrow) {
      let newToDate = new Date(selectedBorrow.to_date);
      newToDate.setDate(newToDate.getDate() + daysToExtend);

      const data = {
        ...selectedBorrow,
        to_date: newToDate.toISOString(),
      };

      await pb.collection("borrows").update(selectedBorrow.id, data);

      const updatedBorrows = borrows.map((borrow) =>
        borrow.id === selectedBorrow.id
          ? { ...borrow, to_date: newToDate.toISOString() }
          : borrow
      );
      setBorrows(updatedBorrows);

      setOpenedExtendModal(false);
    }
  };

  const handleNewLoanClick = () => {
    setOpenedNewLoanModal(true);
  };

  const handleNewLoanSubmit = async () => {
    const errors = {};

    if (!newLoanData.user) {
      errors.user = "Uživatel není vybrán";
    }

    if (!newLoanData.book) {
      errors.book = "Kniha není vybrána";
    }

    if (!newLoanData.count || newLoanData.count <= 0) {
      errors.count = "Počet musí být kladné číslo";
    }

    if (!newLoanData.from_date) {
      errors.from_date = "Datum vypůjčení není zadáno";
    }
    if (!newLoanData.to_date) {
      errors.to_date = "Datum vrácení není zadáno";
    }
    if (
      newLoanData.from_date &&
      newLoanData.to_date &&
      newLoanData.to_date <= newLoanData.from_date
    ) {
      errors.to_date = "Datum vrácení musí být po datu vypůjčení";
    }

    if (Object.keys(errors).length > 0) {
      setNewLoanErrors(errors);
      return;
    }

    try {
      const data = {
        user: newLoanData.user,
        book: newLoanData.book,
        count: newLoanData.count,
        from_date: newLoanData.from_date.toISOString(),
        to_date: newLoanData.to_date.toISOString(),
        return: false,
      };

      const record = await pb.collection("borrows").create(data);
      const user = users.find((u) => u.id === newLoanData.user);
      const book = books.find((b) => b.id === newLoanData.book);

      const updatedBorrow = {
        ...record,
        user_email: user.email,
        book_name: book.name,
      };

      setBorrows([updatedBorrow, ...borrows]);

      setOpenedNewLoanModal(false);
      setNewLoanData({
        user: "",
        book: "",
        count: 1,
        from_date: new Date(),
        to_date: new Date(new Date().setMonth(new Date().getMonth() + 2)),
      });
      setNewLoanErrors({});
    } catch (error) {
      console.error("Failed to create new loan:", error);
    }
  };

  const handleCreateNewUser = async (userData) => {
    const errors = {};
    const email = userData.email.trim();

    if (!email) {
      errors.email = "E-mail není zadán";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.email = "E-mail není platný";
      } else if (
        !email.endsWith("@spsul.cz") &&
        !email.endsWith("@zak.spsul.cz")
      ) {
        errors.email = "E-mail musí končit '@spsul.cz' nebo '@zak.spsul.cz'";
      }
    }

    if (Object.keys(errors).length > 0) {
      setNewUserErrors(errors);
      return;
    }

    try {
      const randomPassword = Math.random().toString(36).slice(-8);
      const newUserRecord = await pb.collection("users").create({
        email,
        username: email.split("@")[0],
        emailVisibility: true,
        verified: false,
        password: randomPassword,
        passwordConfirm: randomPassword,
      });

      await pb.collection("users").requestPasswordReset(email);
      setUsers([...users, newUserRecord]);
      setOpenedNewUserModal(false);
      setNewUserErrors({});
    } catch (error) {
      console.error("Failed to create new user:", error);
    }
  };

  const filteredBorrows = borrows.filter((borrow) => {
    switch (filter) {
      case "returned":
        return borrow.return;
      case "overdue":
        return !borrow.return && borrow.days_remaining < 0;
      case "soon":
        return (
          !borrow.return &&
          borrow.days_remaining >= 0 &&
          borrow.days_remaining < daysAlert
        );
      case "all":
      default:
        return showReturned ? true : !borrow.return;
    }
  });

  function getDayWord(n) {
    n = Math.abs(n);
    if (n === 1) return "den";
    if (n >= 2 && n <= 4) return "dny";
    return "dní";
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Loader color="orange" size="xl" className="loading" />
      </div>
    );
  }

  return (
    <>
      <div className="borrows-header">
        <Select
          label="Filtr"
          placeholder="Vyberte typ"
          data={[
            { value: "all", label: "Vše" },
            { value: "returned", label: "Vrácené" },
            { value: "overdue", label: "Po termínu" },
            { value: "soon", label: "Blíží se termín vrácení" },
          ]}
          value={filter}
          onChange={setFilter}
          mt="md"
        />

        <Checkbox
          label="Zobrazovat vrácené"
          checked={showReturned}
          onChange={(event) => setShowReturned(event.currentTarget.checked)}
          mt="md"
        />

        <Button onClick={handleNewLoanClick} mt="md" color="var(--secondary)">
          Nová vypůjčka
        </Button>
      </div>
      <ScrollArea style={{ height: "90%" }}>
        <DataTable
          value={filteredBorrows}
          stripedRows
          responsiveLayout="scroll"
          paginator
          rows={25}
          emptyMessage="Žádné zápůjčky k zobrazení"
        >
          <Column field="book_name" sortable header="Kniha" />
          <Column
            header="Zapůjčující"
            body={(rowData) => (
              <div style={{ display: "flex", gap: "1em" }}>
                {rowData.user_email}
                {rowData.user_email.endsWith("@zak.spsul.cz") && (
                  <Badge color="red">Student</Badge>
                )}
                {rowData.user_email.endsWith("@spsul.cz") && (
                  <Badge color="green">Učitel</Badge>
                )}
              </div>
            )}
          />
          <Column
            sortable
            field="from_date"
            header="Od"
            body={(rowData) => formatDate(rowData.from_date)}
          />
          <Column
            sortable
            field="to_date"
            header="Do"
            body={(rowData) => formatDate(rowData.to_date)}
          />
          <Column field="book_count" sortable header="Počet" />
          <Column
            header="Stav"
            body={(rowData) => {
              if (rowData.return) {
                return "Vráceno";
              }

              const days = Math.round(rowData.days_remaining);

              if (isNaN(days)) {
                return "Nevráceno";
              }

              if (days < 0) {
                return `Nevráceno, zpoždění ${Math.abs(days)} ${getDayWord(
                  days
                )}`;
              }

              return `Nevráceno, zbývá ${days} ${getDayWord(days)}`;
            }}
          />
          <Column
            header="Akce"
            body={(rowData) => (
              <div style={{ display: "flex", gap: "0.5em" }}>
                {!rowData.return ? (
                  <>
                    <Button
                      color="var(--success)"
                      onClick={() => handleReturnClick(rowData)}
                    >
                      Vráceno
                    </Button>
                    <Button
                      color="var(--warning)"
                      onClick={() => handleExtendClick(rowData)}
                    >
                      Prodloužit vypůjčku
                    </Button>
                  </>
                ) : (
                  <></>
                )}
              </div>
            )}
          />
        </DataTable>
      </ScrollArea>

      <ReturnModal
        opened={openedReturnModal}
        onClose={() => setOpenedReturnModal(false)}
        onConfirm={handleConfirmReturn}
        selectedBorrow={selectedBorrow}
        returnNote={returnNote}
        setReturnNote={setReturnNote}
      />

      <ExtendModal
        opened={openedExtendModal}
        onClose={() => setOpenedExtendModal(false)}
        onConfirm={handleConfirmExtension}
        selectedBorrow={selectedBorrow}
        daysToExtend={daysToExtend}
      />

      <NewLoanModal
        opened={openedNewLoanModal}
        onClose={() => setOpenedNewLoanModal(false)}
        users={users}
        books={books}
        newLoanData={newLoanData}
        newLoanErrors={newLoanErrors}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        setNewLoanData={setNewLoanData}
        setOpenedNewUserModal={setOpenedNewUserModal}
        handleNewLoanSubmit={handleNewLoanSubmit}
      />

      <NewUserModal
        opened={openedNewUserModal}
        onClose={() => setOpenedNewUserModal(false)}
        newUserErrors={newUserErrors}
        onSubmit={handleCreateNewUser}
      />

      <ReturnModal
        opened={openedReturnModal}
        onClose={() => setOpenedReturnModal(false)}
        selectedBorrow={selectedBorrow}
        onConfirm={(note) => handleConfirmReturn(note)} // předáme poznámku
      />

      <ReserveModal
        opened={openedReserveModal}
        onClose={() => setopenedReserveModal(false)}
        selectedBorrow={selectedBorrow}
      />
    </>
  );
};

export default AdminBorrows;
