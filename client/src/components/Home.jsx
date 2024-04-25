import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import "../style/home.css";

const Home = () => {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [latestReviews, setLatestReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLatestReviews = async () => {
      try {
        let response;
        // Fetch reviews based on authentication status
        if (isAuthenticated) {
          const accessToken = await getAccessTokenSilently();
          response = await fetch(`${process.env.REACT_APP_API_URL}/api/user-reviews`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
        } else {
          response = await fetch(`${process.env.REACT_APP_API_URL}/api/latest-reviews`);
        }

        if (!response.ok) {
          throw new Error("Failed to fetch reviews");
        }

        const reviews = await response.json();
        setLatestReviews(reviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLatestReviews();
  }, [isAuthenticated, getAccessTokenSilently]);

  return (
    <div className="home-container">
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div>
          <div className="image-container">
            <a
              href="https://live-production.wcms.abc-cdn.net.au/01fd6f6c040133928edc1f5cb6096a9c?impolicy=wcms_crop_resize&cropH=608&cropW=1080&xPos=0&yPos=216&width=862&height=485"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://live-production.wcms.abc-cdn.net.au/01fd6f6c040133928edc1f5cb6096a9c?impolicy=wcms_crop_resize&cropH=608&cropW=1080&xPos=0&yPos=216&width=862&height=485"
                alt="New Album Is Out"
              />
            </a>
          </div>
          <h3>{isAuthenticated ? `Welcome back! Your Recent Reviews:` : "Latest Reviews on Swift Sounds!"}</h3>
          {latestReviews.length === 0 ? (
            <p>No reviews yet. Write your first review today! </p>
          ) : (
            <ul className="latest-reviews">
              {latestReviews.map((review) => (
                <li key={review.id}>{review.content}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
