import "./style/Book.css";
import { Badge, Button, Modal, Text } from "@mantine/core";
import pb from "../../lib/pocketbase";

const Book = ({
  book,
  hasActiveReservation,
  isLoggedIn,
  activeReservationBook,
  currentBook,
  setCurrentBook,
  onClick,
}) => {
  /*
  const handleReservation = async () => {
    try {
      const data = {
        book: book.id,
        user: pb.authStore.model.id,
        active: true,
      };
      await pb.collection("reservations").create(data);
      setCurrentBook(null);
    } catch (error) {s
      console.error("Chyba při vytváření rezervace:", error);
    }
  };
*/
  const imageSrc =
    book.book_image === ""
      ? "https://placehold.co/500x700.jpg"
      : `${import.meta.env.VITE_API_URL}api/files/${book.collectionId}/${
          book.id
        }/${book.book_image}`;

  return (
    <div className="book" onClick={onClick}>
      {book.available_count === 0 ? (
        <div className="image-overlay-container">
          <img
            src={imageSrc}
            alt={book.book_name}
            style={{ filter: "grayscale(100%)" }}
          />
          <div className="image-overlay">aktuálně nedostupné</div>
        </div>
      ) : (
        <>
          <img src={imageSrc} alt={book.book_name} />
        </>
      )}
      <div className="tags-container">
        {book.tags_ids[0] &&
          book.tags_names.map((tag, index) => (
            <Badge key={index} variant="light" color={book.tags_colors[index]}>
              {tag}
            </Badge>
          ))}
      </div>
      <h1>{book.book_name}</h1>
      <p>
        <strong>{book.authors_names.length > 1 ? "Autoři:" : "Autor:"}</strong>{" "}
        {book.authors_names.join(", ")}
      </p>

      <p>
        <strong>Rok vydání:</strong> {book.book_year}
      </p>
      <p>
        <strong>Počet dostupných knih:</strong> {book.available_count}
      </p>
      <p>
        <strong>Nakladatelství:</strong> {book.publisher_name}
      </p>

      {activeReservationBook === book.id && hasActiveReservation && (
        <p>Kniha je zarezervovaná</p>
      )}
{/* 
      {isLoggedIn && !hasActiveReservation && (
        <Button
          color="orange"
          size="sm"
          style={{ marginTop: "10px" }}
          onClick={() => setCurrentBook(book)}
        >
          Zarezervovat
        </Button>
      )}

      <Modal
        opened={currentBook?.id === book.id}
        onClose={() => setCurrentBook(null)}
        title="Potvrzení rezervace"
      >
        <Text>Opravdu chcete tuto knihu rezervovat?</Text>
        <Button
          color="green"
          style={{ marginTop: "10px" }}
          onClick={handleReservation}
        >
          Ano
        </Button>
        <Button
          color="red"
          style={{ marginTop: "10px", marginLeft: "10px" }}
          onClick={() => setCurrentBook(null)}
        >
          Ne
        </Button>
      </Modal>
      */}
    </div>
  );
};

export default Book;