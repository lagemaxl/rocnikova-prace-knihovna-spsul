import React, { act, useEffect, useState } from "react";
import pb from "../lib/pocketbase";
import "./style/MyAcc.css";
import {
  Tabs,
  Badge,
  Button,
  Modal,
  TextInput,
  Rating,
  Text,
  Group,
  Loader,
} from "@mantine/core";

function MyAcc() {
  const [currentBorrows, setCurrentBorrows] = useState([]);
  const [returnedBorrows, setReturnedBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState(null);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewError, setReviewError] = useState(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const user = pb.authStore.model;
        if (!user) return;

        const records = await pb.collection("borrows_user").getFullList({
          sort: "-borrow_created",
        });

        const current = [];
        const returned = [];

        records.forEach((record) => {
          if (record.return) {
            returned.push(record);
          } else {
            current.push(record);
          }
        });

        setCurrentBorrows(current);
        setReturnedBorrows(returned);
      } catch (err) {
        console.error("Error fetching books:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchReservations = async () => {
      try {
        const reservationRecord = await pb
          .collection("reservations_user")
          .getFullList({ filter: "active = true" });

        if (reservationRecord.length > 0) {
          setReservation(reservationRecord[0]);
        }

      } catch (err) {
        console.error("Error fetching reservations:", err);
      }
    };

    fetchReservations();
    fetchBooks();
  }, []);

  const openReviewModal = (book) => {
    setSelectedBook(book);
    setReviewText("");
    setReviewRating(0);
    setReviewError(null);
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewText || reviewRating === 0) {
      setReviewError("Prosím vyplňte recenzi a hodnocení.");
      return;
    }

    const data = {
      text: reviewText,
      author_ladix: pb.authStore.model?.id,
      author_zub: null,
      rating: reviewRating,
      ladix: !!pb.authStore.model,
      title: selectedBook.book_name,
      authors: selectedBook.authors_names || selectedBook.book_authors_names,
      approved: false,
    };

    try {
      await pb.collection("reviews").create(data);
      setReviewModalOpen(false);
    } catch (error) {
      console.error("Chyba při odesílání recenze:", error);
      setReviewError("Něco se pokazilo. Zkuste to prosím znovu.");
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loader color="orange" size="xl" className="loading" />
      </div>
    );
  }

  const cancelReservation = async () => {
    if (!reservation) return;

    try {
      const updated = await pb
        .collection("reservations")
        .update(reservation.id, {
          active: false,
        });

      setReservation(null); // skryj rezervaci z UI
    } catch (err) {
      console.error("Chyba při rušení rezervace:", err);
    }
  };

  return (
    <div className="myacc">
      <h2>Moje vypůjčené knihy</h2>

      <Tabs defaultValue="current" variant="pills" color="var(--secondary)">
        <Tabs.List>
          <Tabs.Tab value="current">Aktuálně půjčené</Tabs.Tab>
          <Tabs.Tab value="returned">Vrácené knihy</Tabs.Tab>
          <Tabs.Tab value="reserved">Rezervace</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="current" pt="md">
          {currentBorrows.length > 0 ? (
            <div className="myacc-books">
              {currentBorrows.map((book) => (
                <Book key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <p>Nemáte žádné aktuálně vypůjčené knihy.</p>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="returned" pt="md">
          {returnedBorrows.length > 0 ? (
            <div className="myacc-books">
              {returnedBorrows.map((book) => (
                <Book
                  key={book.id}
                  book={book}
                  onAddReview={() => openReviewModal(book)}
                />
              ))}
            </div>
          ) : (
            <p>Nemáte žádné vrácené knihy.</p>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="reserved" pt="md">
          <div className="myacc-books">
            {reservation ? (
              <ReservationBook
                book={reservation}
                onCancel={cancelReservation}
              />
            ) : (
              <p>Nemáte žádnou aktivní rezervaci.</p>
            )}
          </div>
        </Tabs.Panel>
      </Tabs>

      {/* Recenze modal */}
      <Modal
        opened={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={`Recenze: ${selectedBook?.book_name || ""}`}
        centered
        size="lg"
      >
        <Text size="sm" weight={500}>
          Přidat recenzi:
        </Text>
        <Rating value={reviewRating} onChange={setReviewRating} />
        <TextInput
          placeholder="Napište recenzi..."
          value={reviewText}
          onChange={(event) => setReviewText(event.currentTarget.value)}
          mt="sm"
        />
        {reviewError && (
          <Text color="red" size="sm" mt="sm">
            {reviewError}
          </Text>
        )}
        <Group position="right" mt="md">
          <Button color="var(--secondary)" onClick={handleSubmitReview}>
            Odeslat recenzi
          </Button>
        </Group>
      </Modal>
    </div>
  );
}

function Book({ book, onAddReview }) {
  const imageSrc =
    book.book_image === ""
      ? "https://placehold.co/500x700.jpg"
      : `${import.meta.env.VITE_API_URL}api/files/${book.collectionId}/${
          book.id
        }/${book.book_image}`;

  function getDayWord(n) {
    n = Math.abs(n);
    if (n === 1) return "den";
    if (n >= 2 && n <= 4) return "dny";
    return "dní";
  }

  return (
    <div className="myacc-book">
      <img src={imageSrc} alt={book.book_name} />
      <div>
        {!book.return && (
          <Badge color={book.days_remaining < 0 ? "var(--danger)" : "var(--success)"}>
            {book.days_remaining < 0 ? (
              <>
                Zpoždění {Math.abs(Math.round(book.days_remaining))}{" "}
                {getDayWord(book.days_remaining)}
              </>
            ) : (
              <>
                Vrátit do {Math.round(book.days_remaining)}{" "}
                {getDayWord(book.days_remaining)}
              </>
            )}
          </Badge>
        )}
        <h1>{book.book_name}</h1>
        <p>
          <strong>
            {book.authors_names?.length > 1 ||
            book.book_authors_names?.length > 1
              ? "Autoři:"
              : "Autor:"}
          </strong>{" "}
          {book.authors_names?.length > 0
            ? book.authors_names.join(", ")
            : book.book_authors_names?.join(", ")}
        </p>
        <p>
          <strong>Vydavatel:</strong> {book.publisher}
        </p>
        <p>
          <strong>Rok vydání:</strong> {book.book_year}
        </p>
        <p>
          <strong>Vypůjčeno:</strong>{" "}
          {new Date(book.from_date).toLocaleDateString()}
        </p>
        {book.return && (
          <>
            <p>
              <strong>Vráceno:</strong>{" "}
              {new Date(book.to_date).toLocaleDateString()}
            </p>
            {onAddReview && (
              <Button
                color="var(--secondary)"
                size="sm"
                style={{ marginTop: "10px" }}
                onClick={onAddReview}
              >
                Napsat recenzi
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ReservationBook({ book, onCancel }) {
  const imageSrc =
    book.book_image === ""
      ? "https://placehold.co/500x700.jpg"
      : `${import.meta.env.VITE_API_URL}api/files/${book.collectionId}/${
          book.id
        }/${book.book_image}`;

  return (
    <div className="myacc-book">
      <img src={imageSrc} alt={book.book_name} />
      <div>
        <Badge color="var(--secondary)">Rezervováno</Badge>
        <h1>{book.book_name}</h1>
        <p>
          <strong>Autor:</strong> {book.book_authors_names?.join(", ")}
        </p>
        <p>
          <strong>Vydavatel:</strong> {book.book_publisher}
        </p>
        <p>
          <strong>Rok vydání:</strong> {book.book_year}
        </p>
        <Button
          color="var(--secondary)"
          size="sm"
          style={{ marginTop: "10px" }}
          onClick={onCancel}
        >
          Zrušit rezervaci
        </Button>
      </div>
    </div>
  );
}

export default MyAcc;
