import express from "express";
import pkg from "@prisma/client";
import morgan from "morgan";
import cors from "cors";
import { auth } from 'express-oauth2-jwt-bearer';
import * as dotenv from 'dotenv';

dotenv.config();

// Auth middleware configuration
const requireAuth = auth({
  audience: process.env.AUTH0_AUDIENCE,
  issuerBaseURL: process.env.AUTH0_ISSUER,
  tokenSigningAlg: 'RS256'
});

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// Public endpoint - ping-pong connection check
app.get("/ping", (req, res) => {
  res.send("pong");
});

/******************************* API Endpoints for Album ***********************************/
//retrieve spotify access token
const retrieve_access_token = async () => {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", process.env.SPOTIFY_CLIENT_ID);
  params.append("client_secret", process.env.SPOTIFY_CLIENT_SECRET);

  var response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await response.json();
  return data.access_token;
};

const insertAlbumsIntoDatabase = async (albums) => {
  try {
    for (const album of albums) {
      // Check if the album already exists in the database by id
      const existingAlbumById = await prisma.album.findUnique({
        where: { id: album.id },
      });

      // Check if an album with the same title already exists
      const existingAlbumWithTitle = await prisma.album.findUnique({
        where: { title: album.name }, // Assuming album.name is the title of the album
      });

      // If an album with the same id or title does not exist, insert it into the database
      if (!existingAlbumById && !existingAlbumWithTitle) {
        await prisma.album.create({
          data: {
            id: album.id,
            title: album.name,
            artist: "Taylor Swift", 
            releaseDate: album.release_date,
            totalTracks: album.total_tracks,
          },
        });
      }
    }
  } catch (error) {
    console.error("Error inserting albums into the database:", error);
    // Handle error if needed
  }
};


// Call Spotify API to fetch Taylor Swift's albums
app.get("/api/taylor-swift-albums", async (req, res) => {
  try {
    const accessToken = await retrieve_access_token();
    const response = await fetch(
      "https://api.spotify.com/v1/search?q=Taylor+Swift&type=album&limit=30",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch albums");
    }

    const data = await response.json();
    // Insert albums into the database
    await insertAlbumsIntoDatabase(data.albums.items);

    res.json(data.albums.items);
  } catch (error) {
    
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// fetch album details by AlbumID
app.get("/api/details/:albumId", async (req, res) => {
  try {
    const { albumId } = req.params;
    const accessToken = await retrieve_access_token();
    const response = await fetch(
      `https://api.spotify.com/v1/albums/${albumId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch albums");
    }

    const albumDetails = await response.json();
    res.json(albumDetails);
  } catch (error) {
    
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/******************************* API Endpoints for Review ***********************************/

// create a new album review
app.post("/api/add-review", requireAuth, async (req, res) => {
  try {
    
    // Retrieve user ID from the authentication payload
    const auth0Id = req.auth.payload.sub;

    const { content, title, albumId } = req.body;
    // Create a new review record using Prisma
    const newReview = await prisma.review.create({
      data: {
        title: title,
        content: content,
        user: {
          connect: { auth0Id } // Connect the review to the user
        },
        album: {
          connect: { id: albumId } // Connect the review to the album
        }
      }
    });

    // Respond with the newly created review
    res.status(201).json(newReview);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
});

//get all reviews for a user_id
app.get("/api/user-reviews", requireAuth, async (req, res) => {
  try {
    const auth0Id = req.auth.payload.sub;
    const user = await prisma.user.findUnique({
      where: {
        auth0Id: auth0Id,
      },
    });
    if (user) {
      const reviews = await prisma.review.findMany({
        where: {
          userId: user.id,
        },
      });
      res.send(reviews);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

// Get all reviewed albums by user_id
app.get("/api/albums/:user_id", requireAuth, async (req, res) => {
  try {
    // Find user by auth0Id
    const auth0Id = req.auth.payload.sub;
    const user = await prisma.user.findUnique({
      where: {
        auth0Id: auth0Id,
      },
    });

    // Find reviews by user ID
    const userReviews = await prisma.review.findMany({
      where: {
        userId: user.id,
      },
    });

    // Extract unique album IDs from the user's reviews
    const albumIds = [...new Set(userReviews.map(review => review.albumId))];

    // Fetch album details for the unique album IDs
    const albums = await prisma.album.findMany({
      where: {
        id: {
          in: albumIds,
        },
      },
    });

    res.send(albums);
  } catch (error) {
    console.error("Error fetching albums reviewed by user:", error);
    res.status(500).send("Internal Server Error");
  }
});

// get all reviews by album_id
app.get("/api/reviews/:album_id", async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        albumId: req.params.album_id,
      },
    });
    res.send(reviews);
  } catch (error) {
    console.error("Error fetching reviews by album ID:", error);
    res.status(500).send("Internal Server Error");
  }
});

//delete a review
app.delete("/api/review/:id", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const reviewId = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: {
        auth0Id: auth0Id,
      },
    });

    if (user) {
      const review = await prisma.review.findUnique({
        where: {
          id: reviewId,
        },
      });

      if (review.userId === user.id) {
        await prisma.review.delete({
          where: {
            id: reviewId,
          },
        });
        res.status(200).send("Review deleted");
      }
    }
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
});

//update a review
app.put("/api/review/:id", requireAuth, async (req, res) => {
  const { newTitle, newContent } = req.body; 
  const auth0Id = req.auth.payload.sub; 
  const reviewId = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: {
        auth0Id: auth0Id,
      },
    });

    if (user) {
      const review = await prisma.review.findUnique({
        where: {
          id: reviewId,
        },
      });

      if (review.userId === user.id) {
        const updatedReview = await prisma.review.update({
          where: {
            id: reviewId,
          },
          data: {
            title: newTitle,
            content: newContent,
          },
        });
 
        // Return the updated review data
        res.status(200).send(updatedReview);
      } else {
        res.status(403).send("You do not have permission to update this review.");
      }
    } else {
      res.status(404).send("User not found.");
    }
  } catch (err) {
    console.error("Error updating review:", err);
    res.status(500).send("Internal Server Error");
  }
});


// Endpoint to retrieve the latest 5 reviews
app.get("/api/latest-reviews", async (req, res) => {
  try {
    const latestReviews = await prisma.review.findMany({
      orderBy: {
        createdAt: 'desc' // Order by createdAt field in descending order to get the latest reviews
      },
      take: 5 // Limit the number of reviews to 5
    });
    
    if (latestReviews.length === 0) {
      return res.status(404).json({ error: "No reviews found" });
    }

    res.json(latestReviews);
  } catch (error) {
    console.error("Error retrieving latest reviews:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


/******************************* API Endpoints for User ***********************************/

// verify user; if user exists, return user; if not, create user and then return user
app.post("/verify-user", requireAuth, async (req, res) => {
  const auth0Id = req.auth.payload.sub;
  const email = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/email`];
  const name = req.auth.payload[`${process.env.AUTH0_AUDIENCE}/name`];

  const user = await prisma.user.findUnique({
    where: {
      auth0Id: auth0Id,
    },
  });
  if (user) {
    res.json(user);
  } else {
    const newUser = await prisma.user.create({
      data: {
        auth0Id: auth0Id,
        email: email,
        name: name,
      },
    });
    res.json(newUser);
  }
});

// Endpoint to fetch user information 
app.get("/api/user-info/:id", requireAuth, async (req, res) => {
  try {
    const auth0Id = req.params.id;
    const user = await prisma.user.findUnique({
      where: {
        auth0Id: auth0Id,
      },
      select: {
        email: true,
        name: true,
        signUpDate: true,
        age: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user information:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// Update user information (name, age)
app.put("/api/user/:id", requireAuth, async (req, res) => {
  const auth0Id = req.params.id;
  
  try {
    // Destructure name and age from req.body
    const { name, age } = req.body;

    // Find the user based on the auth0Id
    const user = await prisma.user.findUnique({
      where: {
        auth0Id: auth0Id,
      },
    });

    if (!user) {
      // If user is not found, return 404 Not Found
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user's name if provided
    if (name) {
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          name: name,
        },
      });
      console.log('User name updated successfully');
    }

    // Update the user's age if provided
    if (age) {
      // Ensure the age is greater than 0
      if (age <= 0) {
        return res.status(400).json({ error: "Age must be greater than 0" });
      }

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          age: parseInt(age),
        },
      });
      console.log('User age updated successfully');
    }

    // Fetch the updated user data
    const updatedUserData = await prisma.user.findUnique({
      where: {
        auth0Id: auth0Id,
      },
    });
    
    // Return the updated user data
    res.status(200).json(updatedUserData);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});