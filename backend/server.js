const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Enable CORS
app.use(cors());

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());




// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes); // Mount ticket routes under /api/tickets

// Root route for testing
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});