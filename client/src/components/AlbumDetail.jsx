import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuthToken } from "../AuthTokenContext";
import { useAuth0 } from "@auth0/auth0-react";
import "../style/albumDetail.css";

function AlbumDetail() {
  const { albumId } = useParams();
  const [album, setAlbum] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState();
  const [reviews, setReviews] = useState([]);
  const [newReviewTitle, setNewReviewTitle] = useState([]);
  const [newReview, setNewReview] = useState("");
  const { accessToken } = useAuthToken();
  const { isAuthenticated } = useAuth0();


  useEffect(() => {
    const fetchAlbumDetails = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/details/${albumId}`); // Include albumId in the URL
        if (!response.ok) {
          throw new Error('Failed to fetch album details');
        }
        const albumDetails = await response.json();
        setAlbum(albumDetails);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbumDetails();
  }, [albumId]);
  
// Fetch current reviews of the album
  useEffect(() => {
    // Fetch reviews for the album 
    const fetchReviews = async () => {
      try {
        // Make a fetch request to backend API to get the reviews for this album
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/reviews/${albumId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch reviews for the album');
        }
        const reviewsData = await response.json();
        setReviews(reviewsData);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    fetchReviews();
  }, [albumId]);


  // Function to handle adding a new review
const handleAddReview = async () => {
  try {
    // Validate review title and content
    if (!newReviewTitle || !newReview) {
      throw new Error("Review title and content cannot be empty");
    }

    // Make a POST request to add a new review
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/add-review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        albumId,
        title: newReviewTitle,
        content: newReview,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to add review");
    }

    // Refresh reviews after adding new review
    const reviewsResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/reviews/${albumId}`);
    if (!reviewsResponse.ok) {
      throw new Error('Failed to fetch reviews for the album');
    }
    const reviewsData = await reviewsResponse.json();
    setReviews(reviewsData);

    // Clear the new review input field
    setNewReview("");
    setNewReviewTitle(""); 
  } catch (error) {
    console.error("Error adding review:", error);
  }
};

  const handleReviewChange = (event) => {
    setNewReview(event.target.value);
  };

  const handleReviewTitleChange = (event) => {
    setNewReviewTitle(event.target.value);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="album-detail-container">
      {/* Display album image */}
      {album.images && album.images.length > 0 && (
        <img src={album.images[0].url} alt="Album Cover" className="album-image" />
      )}
      <div className="album-info">
        <h2>{album.name}</h2>
        <h3>Details:</h3>
        <p>Artist: {album.artists && album.artists.map(artist => artist.name).join(", ")}</p>
        <p>Release Date: {album.release_date}</p>
        <p>Total Tracks: {album.total_tracks}</p>
        <p>Spotify ID: {album.id}</p>
      </div>

      {/* Reviews section */}
      <div className="reviews-section">
        <h3>Review Section</h3>
        {/* Conditionally render the review textarea and button based on authentication status */}
        {isAuthenticated && (
          <>
          {/* Input field for review title */}
            <input
            type="text"
            value={newReviewTitle}
            onChange={handleReviewTitleChange}
            placeholder="Enter review title"
            className="review-title-input"
            />
          {/* Textarea for review content */}
            <textarea
              value={newReview}
              onChange={handleReviewChange}
              placeholder="Write a review..."
              className="review-textarea" 
            />
            <button onClick={handleAddReview} className="add-review-button">Add Review</button>
          </>
        )}
        {!isAuthenticated && <p>Please log in to leave a review.</p>}
      </div>

      <div className="reviews-section">
        <h3>User Reviews</h3>
        {reviews.length === 0 ? (
          <p>No reviews for this album yet. Be the first to add one!</p>
        ) : (
          reviews.map((review, index) => (
            <div key={index} className="review-item">
              <p>Title: {review.title}</p>
              <p>{new Date(review.createdAt).toLocaleString()}</p>
              <p>{review.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AlbumDetail;
