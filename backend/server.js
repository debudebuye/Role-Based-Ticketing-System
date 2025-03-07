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
const corsOptions = {
  origin: "https://role-based-ticketing-system-bice.vercel.app", // Allow your frontend
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true, // Allow cookies if needed
};

app.use(cors(corsOptions));


app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://role-based-ticketing-system-bice.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  next();
});



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