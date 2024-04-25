import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import "../style/profile.css";

const ProfilePage = () => {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [userInfo, setUserInfo] = useState({});
  const [age, setAge] = useState('');
  const [name, setName] = useState('');
  const [albums, setAlbums] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        if (isAuthenticated) {
          // Fetch user information from backend
          const accessToken = await getAccessTokenSilently();
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/user-info/${user.sub}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          if (!response.ok) throw new Error("Failed to fetch user information");
          const userData = await response.json();
          setUserInfo(userData);
        }
      } catch (error) {
        console.error('Error fetching user information:', error);
      }
    };

    const fetchAlbumsByUser = async () => {
      try {
        if (isAuthenticated) {
          const accessToken = await getAccessTokenSilently();
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/albums/${user.sub}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          const data = await response.json();
          setAlbums(data);
        }
      } catch (error) {
        console.error('Error fetching albums:', error);
      }
    };

    const fetchReviewHistory = async () => {
      try {
        if (isAuthenticated) {
          const accessToken = await getAccessTokenSilently();
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/user-reviews`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          const data = await response.json();
          setReviews(data);
        }
      } catch (error) {
        console.error('Error fetching review history:', error);
      }
    };

    fetchUserInfo();
    fetchAlbumsByUser();
    fetchReviewHistory();
    
  }, [isAuthenticated, getAccessTokenSilently, user.sub]);


  const fetchAndUpdateUserInfo = async () => {
    try {
      if (!isAuthenticated || !user.sub) return;

      const accessToken = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/user-info/${user.sub}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch updated user information");
      const updatedUserInfo = await response.json();

      setUserInfo(updatedUserInfo);
      setAge('');
      setName('');
    } catch (error) {
      console.error('Error updating user information:', error);
    }
  };

  const handleUpdateAge = async () => {
    // Check if age is greater than 0
    if (age <= 0) {
      alert('Age must be greater than 0');
      console.error('Age must be greater than 0');
      return;
    }

    try {
      // Update user information in the backend
      const accessToken = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/user/${user.sub}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ age }),
      });
      if (!response.ok) throw new Error("Failed to update user information");

      // Fetch and update user information from backend
      await fetchAndUpdateUserInfo();
      console.log('User age updated successfully');
    } catch (error) {
      console.error('Error updating user age:', error);
    }
  };

  const handleUpdateName = async () => {
    // Check if name is empty
    if (!name.trim()) {
       alert('Name cannot be empty');
       console.error('Name cannot be empty');
       return;
  }

    try {
      // Update user information in the backend
      const accessToken = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/user/${user.sub}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error("Failed to update user information");

      // Fetch and update user information from backend
      await fetchAndUpdateUserInfo();

      console.log('User name updated successfully');
    } catch (error) {
      console.error('Error updating user name:', error);
    }
  };


  return (
    <div>
      <h1>Profile</h1>
      {isAuthenticated && userInfo && (
        <div className="user-info">
          <h2>Personal Information</h2>
          <p>Nickname: {userInfo.name}</p>
          <p>Age: {userInfo.age}</p>
          <p>Email: {userInfo.email}</p>
          <p>Sign-up Date: {new Date(userInfo.signUpDate).toLocaleDateString()}</p>
          <label>
            Age: 
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </label>
          <button onClick={handleUpdateAge}>Update Age</button>
          <br />
          <label>
            Nickname: 
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <button onClick={handleUpdateName}>Update Nickname</button>
        </div>
      )}
      <div className="albums">
        <h2>Albums Reviewed</h2>
        {albums.length === 0 ? (
          <p>No albums reviewed yet.</p>
        ) : (
          <ul>
            {albums.map((album) => (
              <li key={album.id}>
                <a href={`/details/${album.id}`} className="album-link">
                  <p className="album-title"> {album.title}</p>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="review-history">
        <h2>Review History</h2>
        {reviews.length === 0 ? (
          <p>No review history yet. Write reviews now!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="review-item">
              <p className="review-title">Title: {review.title}</p>
              <p className="review-content">Review: {review.content}</p>
            </div>   
          ))
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
