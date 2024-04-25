import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../style/albums.css";

const AlbumsPage = () => {
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAlbums() {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/taylor-swift-albums`); 
        if (!response.ok) {
          throw new Error("Failed to fetch albums");
        }
        const data = await response.json();
        setAlbums(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching albums:", error);
      }
    }

    fetchAlbums();
  }, []);

  return (
    <>
      <h2>Taylor Swift's Albums</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="album-container">
          {albums.map((album, index) => (
            // Filter out albums with the same name
            albums.findIndex(a => a.name === album.name) === index && (
              <Link to={`/details/${album.id}`} key={album.id}>
                <div>
                  <h4>{album.name}</h4>
                  <img src={album.images[0].url} alt={album.name} />
                </div>
              </Link>
            )
          ))}
        </div>
      )}
    </>
  );
};

export default AlbumsPage;
