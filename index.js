require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();

const API_KEY = process.env.GOOGLE_API_KEY; // Load API key from environment variables

// Allow CORS for specific origins
const allowedOrigins = [
  "http://localhost:8080", // Local frontend
  "http://localhost:8081", // Alternate local frontend
  "https://your-deployed-frontend.com", // Deployed frontend
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET"], // Allow only GET requests
    credentials: true, // Allow cookies if needed
  })
);

// Autocomplete Proxy Endpoint
app.get("/place/autocomplete", async (req, res) => {
  try {
    const { input } = req.query;
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/place/autocomplete/json",
      {
        params: {
          input,
          key: API_KEY,
        },
      }
    );
    res.json(response.data); // Send back autocomplete results
  } catch (error) {
    console.error("Error fetching autocomplete:", error.message);
    res.status(500).json({ error: "Failed to fetch autocomplete suggestions" });
  }
});

// Place Details Proxy Endpoint
app.get("/place/details", async (req, res) => {
  try {
    const { place_id } = req.query;
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/place/details/json",
      {
        params: {
          place_id,
          key: API_KEY,
        },
      }
    );
    res.json(response.data); // Send back place details
  } catch (error) {
    console.error("Error fetching place details:", error.message);
    res.status(500).json({ error: "Failed to fetch place details" });
  }
});

// Photo Proxy Endpoint
app.get("/place/photo", async (req, res) => {
  try {
    const { maxwidth, photoreference } = req.query;

    const response = await axios({
      method: "get",
      url: "https://maps.googleapis.com/maps/api/place/photo",
      params: {
        maxwidth,
        photoreference,
        key: API_KEY,
      },
      responseType: "stream", // Stream photo directly to the response
    });

    response.data.pipe(res); // Pipe the photo data to the client
  } catch (error) {
    console.error("Error fetching photo:", error.response?.data || error.message); // Log the error details
    res.status(500).json({ error: "Failed to fetch place photo" });
  }
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.message);
  res.status(500).json({ error: "An unexpected error occurred" });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
