import React from "react";
import { useEffect, useState } from "react";
import pb from "../../../lib/pocketbase";
import { Skeleton, Button, Modal, Textarea, Rating } from "@mantine/core";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

function ReviewsTab() {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
  };

  const approveReview = async (review) => {
    const updatedData = { ...review, approved: true };

    try {
      await pb.collection("reviews").update(review.id, updatedData);
      setReviews(reviews.filter((r) => r.id !== review.id));
    } catch (error) {
      console.error("Failed to approve review", error);
    }
  };

  const deleteReview = async (review) => {
    try {
      await pb.collection("reviews").delete(review.id);
      setReviews(reviews.filter((r) => r.id !== review.id));
    } catch (error) {
      console.error("Failed to delete review", error);
    }
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        const records = await pb.collection("reviews_show").getFullList({
          filter: `approved = false`,
        });
        setReviews(records);
        setLoadingReviews(false);
      } catch (error) {
        console.error("Failed to fetch reviews", error);
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, []);

  const renderReviewActions = (rowData) => (
    <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
      <Button
        color="var(--success)"
        size="xs"
        onClick={() => approveReview(rowData)}
      >
        Schválit
      </Button>
      <Button
        color="var(--danger)"
        size="xs"
        onClick={() => deleteReview(rowData)}
      >
        Smazat
      </Button>
    </div>
  );

  return (
    <div>
      <h2>Recenze ke schválení</h2>
      {loadingReviews ? (
        <Skeleton height={200} />
      ) : (
        <DataTable
          value={reviews}
          responsiveLayout="scroll"
          emptyMessage="Žádné recenze ke schválení"
        >
          <Column
            field="created"
            header="Datum vytvoření"
            body={(rowData) => formatDate(rowData.created)}
          />
          <Column field="username" header="Uživatel" />
          <Column field="text" header="Recenze" />
          <Column field="title" header="Knížka" />
          <Column
            field="rating"
            header="Hodnocení"
            body={(rowData) => <Rating readOnly value={rowData.rating} />}
          />
          <Column
            header="Akce"
            style={{ display: "flex", justifyContent: "center" }}
            body={renderReviewActions}
          />
        </DataTable>
      )}

      <Modal
        opened={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Schválení recenze"
      >
        <p>Chcete tuto recenzi schválit nebo smazat?</p>
        <Textarea
          value={selectedReview?.text || ""}
          readOnly
          style={{ marginBottom: "1rem" }}
        />
        <Button
          color="green"
          onClick={() => {
            approveReview(selectedReview);
            setIsReviewModalOpen(false);
          }}
        >
          Schválit
        </Button>
        <Button
          color="red"
          onClick={() => {
            deleteReview(selectedReview);
            setIsReviewModalOpen(false);
          }}
          style={{ marginLeft: "1rem" }}
        >
          Smazat
        </Button>
      </Modal>
    </div>
  );
}

export default ReviewsTab;
