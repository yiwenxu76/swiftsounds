import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import "../style/reviews.css";

const UserReviewsPage = () => {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [reviews, setReviews] = useState([]);
  const [editingReviewId, setEditingReviewId] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    const fetchUserReviews = async () => {
      try {
        if (isAuthenticated) {
          const accessToken = await getAccessTokenSilently();
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/user-reviews`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (!response.ok) throw new Error("Failed to fetch user's reviews");
          const reviewsData = await response.json();
          setReviews(reviewsData);
        } 
      } catch (error) {
        console.error('Error fetching user reviews:', error);
      }
    };

    fetchUserReviews();
  }, [isAuthenticated, getAccessTokenSilently]);

  const handleDeleteReview = async (reviewId) => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this review?');
      if (!confirmDelete) return; // If user cancels, exit function  
      const accessToken = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/review/${reviewId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete review');
      setReviews(reviews.filter(review => review.id !== reviewId));
      console.log(`Review with ID ${reviewId} deleted successfully`);
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const handleEditReview = async (reviewId) => {
    try {
      const accessToken = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/review/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ newTitle: editedTitle, newContent: editedContent }), 
      });
      if (!response.ok) throw new Error('Failed to update review');
      const updatedReview = await response.json();
      setReviews(reviews.map(review => review.id === reviewId ? updatedReview : review));
      console.log(`Review with ID ${reviewId} updated successfully`);
      setEditingReviewId();
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };
  

  return (
    <div className="review-list">
      <h1>My Reviews Hub</h1>
      {reviews.length === 0 ? (
        <p>You have no reviews yet. Create one today!</p>
      ) : (
        <ul>
          {reviews.map((review) => (
            <li key={review.id}>
              <div className="review-item">
                {editingReviewId === review.id ? (
                  <div className="edit-mode">
                    <input
                      className="edited-title"
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                    />
                    <textarea
                      className="edited-content"
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                    />
                    <button className="save-button" onClick={() => handleEditReview(review.id)}>Save</button>
                  </div>
                ) : (
                  <div className="normal-mode">
                    <h3>{review.title}</h3>
                    <p>{review.content}</p>
                    <button className="edit-button" onClick={() => {
                      setEditedTitle(review.title);
                      setEditedContent(review.content);
                      setEditingReviewId(review.id);
                    }}>Edit</button>
                    <button className="delete-button" onClick={() => handleDeleteReview(review.id)}>Delete</button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserReviewsPage;
