import React, { useEffect, useState, useCallback } from "react";
import pb from "../lib/pocketbase";
import "./style/Home.css";
import Book from "./components/Book";
import { IconPencil, IconSearch, IconSend } from "@tabler/icons-react";
import { IconX, IconTrash, IconDotsVertical } from "@tabler/icons-react";
import {
  TextInput,
  Pagination,
  Loader,
  Group,
  MultiSelect,
  Select,
  Modal,
  Text,
  Badge,
  Rating,
  Menu,
  Button,
} from "@mantine/core";

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const Home = () => {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortOption, setSortOption] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(pb.authStore.isValid);
  const [hasActiveReservation, setHasActiveReservation] = useState(false);
  const [activeReservationBook, setActiveReservationBook] = useState(null);
  const [currentBook, setCurrentBook] = useState(null);

  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewError, setReviewError] = useState(null);
  const [currentReviewId, setCurrentReviewId] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [bookDetails, setBookDetails] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const handleAuthChange = () => {
      setIsLoggedIn(pb.authStore.isValid);
    };

    pb.authStore.onChange(handleAuthChange);

    return () => {
      pb.authStore.onChange(handleAuthChange);
    };
  }, []);

  const fetchReviews = async (title) => {
    try {
      const filterCondition =
        title == 1984
          ? `title = ${title} && approved=true`
          : `title = "${title}" && approved=true`;

      const result = await pb.collection("reviews_show").getFullList({
        filter: filterCondition,
      });

      setReviews(result);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    }
  };

  const booksPerPage = 25;
  const debouncedSearch = useDebounce(search, 500);

  const fetchTags = useCallback(async () => {
    try {
      const result = await pb.collection("tags").getList(1, 100);
      const tagOptions = result.items.map((tag) => ({
        value: tag.id,
        label: tag.name,
      }));
      setTags(tagOptions);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  }, []);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const tagFilters = selectedTags
        .map((tagId) => `tags_ids~"${tagId}"`)
        .join(" || ");

      const filter = `(book_name~"${debouncedSearch}" || authors_names~"${debouncedSearch}")${
        tagFilters ? ` && (${tagFilters})` : ""
      }`;

      let sort = "book_name";
      if (sortOption === "author_asc") sort = "authors_names";
      else if (sortOption === "author_desc") sort = "-authors_names";
      else if (sortOption === "title_asc") sort = "book_name";
      else if (sortOption === "title_desc") sort = "-book_name";
      else if (sortOption === "oldest") sort = "book_year";
      else if (sortOption === "newest") sort = "-book_year";

      const resultList = await pb
        .collection("books_show")
        .getList(activePage, booksPerPage, {
          filter: filter,
          sort: sort,
        });

      setBooks(resultList.items);
      setTotalPages(Math.ceil(resultList.totalItems / booksPerPage));
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activePage, selectedTags, sortOption]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  useEffect(() => {
    fetchBooks();
  }, [debouncedSearch, activePage, selectedTags, sortOption, fetchBooks]);

  useEffect(() => {
    const fetchData = async () => {
      if (pb.authStore.model) {
        setIsLoggedIn(true);

        const reservations = await pb.collection("reservations").getFullList({
          filter: `user="${pb.authStore.model.id}" && active=true`,
        });
        setHasActiveReservation(reservations.length > 0);
        setActiveReservationBook(reservations[0]?.book || null);
      }
    };
    fetchData();
  }, [currentBook, isLoggedIn]);

  const handleBookClick = async (book) => {
    setBookDetails(book);
    await fetchReviews(book.book_name);
    setModalOpen(true);
    //console.log(book.book_isbn);
  };

  const imageSrc = !bookDetails?.book_image
    ? "https://placehold.co/500x700.jpg"
    : `${import.meta.env.VITE_API_URL}api/files/${bookDetails.collectionId}/${
        bookDetails.id
      }/${bookDetails.book_image}`;

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
      title: bookDetails.book_name,
      authors: bookDetails.authors,
      approved: false,
    };

    try {
      if (currentReviewId) {
        await pb.collection("reviews").update(currentReviewId, data);
        setReviews(
          reviews.map((review) =>
            review.id === currentReviewId ? { ...review, ...data } : review
          )
        );
      } else {
        const record = await pb.collection("reviews").create(data);
        fetchReviews(bookDetails.book_name);
      }

      setReviewText("");
      setReviewRating(0);
      setReviewError(null);
      setCurrentReviewId(null);
    } catch (error) {
      console.error("Error submitting review:", error);
      setReviewError("Něco se pokazilo. Zkuste to prosím znovu.");
    }
  };

  const handleEditReview = (review) => {
    setReviewText(review.text);
    setReviewRating(review.rating);
    setCurrentReviewId(review.id);
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await pb.collection("reviews").delete(reviewId);
      setReviews(reviews.filter((review) => review.id !== reviewId));
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  return (
    <>
      <div className="home-header">
        <Group position="apart" align="center"></Group>
        <MultiSelect
          data={tags}
          placeholder="Vyberte štítky..."
          searchable
          clearable
          checkIconPosition="right"
          value={selectedTags}
          onChange={(values) => {
            setSelectedTags(values);
            setActivePage(1);
          }}
          className="tag-selector"
        />
        <Select
          data={[
            { value: "author_asc", label: "Autor - vzestupně" },
            { value: "author_desc", label: "Autor - sestupně" },
            { value: "title_asc", label: "Název - vzestupně" },
            { value: "title_desc", label: "Název - sestupně" },
            { value: "oldest", label: "Od nejstarších" },
            { value: "newest", label: "Od nejmladších" },
          ]}
          placeholder="Řadit podle..."
          clearable
          value={sortOption}
          onChange={(value) => {
            setSortOption(value);
            setActivePage(1);
          }}
          className="sort-selector"
        />
        <TextInput
          placeholder="Vyhledat knihy..."
          value={search}
          leftSection={<IconSearch stroke={2} width={20} />}
          rightSection={
            <IconX
              stroke={2}
              width={20}
              onClick={() => {
                setSearch("");
                setActivePage(1);
              }}
              style={{ cursor: "pointer" }}
            />
          }
          onChange={(event) => {
            setSearch(event.currentTarget.value);
            setActivePage(1);
          }}
          className="search-bar"
        />
      </div>

      <div className="books">
        {loading ? (
          <Loader color="orange" size="xl" className="loading" />
        ) : books.length > 0 ? (
          books.map((book) => (
            <Book
              key={book.id}
              book={book}
              isLoggedIn={isLoggedIn}
              activeReservationBook={activeReservationBook}
              hasActiveReservation={hasActiveReservation}
              currentBook={currentBook}
              setCurrentBook={setCurrentBook}
              onClick={() => handleBookClick(book)}
            />
          ))
        ) : (
          <p>Nepodařilo se načíst knihy</p>
        )}
      </div>

      <div className="pagination">
        <Pagination
          total={totalPages}
          page={activePage}
          onChange={setActivePage}
          mt="sm"
          color="var(--secondary)"
        />
      </div>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={bookDetails?.book_name || "Detail knihy"}
        centered
        size="xl"
      >
        {bookDetails && (
          <>
            <div className="book-details">
              <img src={imageSrc} width={"30%"} alt={bookDetails.book_name} />
              <div className="book-details-texts">
                <div className="book-details-texts-header">
                  <h3>{bookDetails.book_name}</h3>
                  <Text>{bookDetails.authors_names.join(", ")}</Text>
                </div>
                <div className="book-detais-body">
                  <Text>
                    <strong>Rok vydání:</strong>
                    <br /> {bookDetails.book_year}
                  </Text>
                  <Text>
                    <strong>Počet dostupných knih:</strong>
                    <br />
                    {bookDetails.available_count}
                  </Text>
                  <Text>
                    <strong>Nakladatelství:</strong>
                    <br /> {bookDetails.publisher_name}
                  </Text>
                  <Text>
                    <strong>ISBN:</strong> <br />
                    {bookDetails.book_isbn}
                  </Text>
                </div>

                {isLoggedIn &&
                  !hasActiveReservation &&
                  bookDetails.available_count > 0 && (
                    <Button
                      color="var(--secondary)"
                      size="sm"
                      style={{ marginTop: "10px" }}
                      onClick={async () => {
                        try {
                          const data = {
                            book: bookDetails.id,
                            user: pb.authStore.model.id,
                            active: true,
                          };
                          await pb.collection("reservations").create(data);
                          setHasActiveReservation(true);
                          setActiveReservationBook(bookDetails.id);
                        } catch (error) {
                          console.error("Chyba při rezervaci:", error);
                        }
                      }}
                    >
                      Zarezervovat
                    </Button>
                  )}

                <div className="tags-container">
                  {bookDetails.tags_ids[0] &&
                    bookDetails.tags_names.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="light"
                        color={bookDetails.tags_colors[index]}
                      >
                        {tag}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>
            {reviews.length > 0 ? (
              <div className="reviews-section">
                {reviews.map((review) => (
                  <div key={review.id} className="review-item">
                    <div className="review-header">
                      <Text>
                        <strong>
                          {review.ladix
                            ? review.username
                            : "Uživatel z webu knihotok.cz"}
                        </strong>
                      </Text>
                      <div className="review-header-right">
                        <Rating readOnly value={review.rating} />
                        {isLoggedIn &&
                        pb.authStore.model?.id === review.user_id ? (
                          <Menu shadow="md" width={200}>
                            <Menu.Target className="iconDots">
                              <IconDotsVertical size={20} />
                            </Menu.Target>

                            <Menu.Dropdown>
                              <Menu.Item
                                color="black"
                                leftSection={<IconPencil size={14} />}
                                onClick={() => handleEditReview(review)}
                              >
                                Upravit
                              </Menu.Item>
                              <Menu.Item
                                color="red"
                                leftSection={<IconTrash size={14} />}
                                onClick={() => handleDeleteReview(review.id)}
                              >
                                Smazat
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        ) : (
                          isLoggedIn &&
                          pb.authStore.model.role === "admin" &&
                          review.ladix === true && (
                            <Menu shadow="md" width={200}>
                              <Menu.Target className="iconDots">
                                <IconDotsVertical size={20} />
                              </Menu.Target>

                              <Menu.Dropdown>
                                <Menu.Item
                                  color="red"
                                  leftSection={<IconTrash size={14} />}
                                  onClick={() => handleDeleteReview(review.id)}
                                >
                                  Smazat
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          )
                        )}
                      </div>
                    </div>
                    <Text>{review.text}</Text>
                    <Text size="xs" align="end" color="dimmed">
                      {new Date(review.created).toLocaleString()}
                    </Text>
                  </div>
                ))}
              </div>
            ) : (
              <Text mt="md" mb="sm" color="dimmed">
                Žádné recenze nejsou k dispozici.
              </Text>
            )}
            {isLoggedIn && (
              <div className="add-review-section">
                <Text mt="md" weight={500}>
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
                <Group position="right" mt="sm">
                  <button
                    className="submit-review-button"
                    onClick={handleSubmitReview}
                  >
                    Odeslat
                  </button>
                </Group>
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  );
};

export default Home;
