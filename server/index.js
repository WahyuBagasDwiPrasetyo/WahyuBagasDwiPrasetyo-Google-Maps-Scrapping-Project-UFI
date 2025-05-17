const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();
const port = 5000;

app.use(bodyParser.json());
app.use(cors());

// MySQL connection
const db = mysql.createConnection({
  host: "localhost", // Replace with your MySQL host (e.g., "127.0.0.1" or "localhost")
  user: "root", // Replace with your MySQL username
  password: "", // Replace with your MySQL password
  database: "google_maps_scraper", // Ensure this matches your database name
  port: 3306, // Optional: Replace with your MySQL port if it's not the default (3306)
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err.message); // Log detailed error message
    console.error("Ensure the database server is running and the credentials are correct.");
    return;
  }
  console.log("Connected to the database.");
});

// Add a test query to verify the connection
db.query("SELECT 1", (err, results) => {
  if (err) {
    console.error("Test query failed:", err.message); // Log test query error
    return;
  }
  console.log("Test query succeeded. Database connection is working.");
});

// Register endpoint
app.post("/register", async (req, res) => {
  const { email, password, role } = req.body;

  console.log("Register request received:", { email, password, role }); // Log incoming request

  if (!email || !password || !role) {
    console.log("Missing fields in register request."); // Log missing fields
    return res.status(400).send("All fields are required."); // Ensure all fields are provided
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password
    const query = "INSERT INTO users (email, password, role) VALUES (?, ?, ?)";
    db.query(query, [email, hashedPassword, role], (err, result) => {
      if (err) {
        console.error("Error during registration:", err); // Log database error
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).send("Email already exists."); // Handle duplicate email
        }
        return res.status(500).send("An error occurred."); // Handle other errors
      }
      console.log("User registered successfully:", result); // Log successful registration
      res.status(200).send("User registered successfully.");
    });
  } catch (error) {
    console.error("Error hashing password:", error); // Log hashing error
    res.status(500).send("An error occurred.");
  }
});

// Login endpoint
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  console.log("Login request received:", { email, password }); // Log incoming request

  if (!email || !password) {
    console.log("Missing fields in login request."); // Log missing fields
    return res.status(400).send("All fields are required."); // Ensure all fields are provided
  }

  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error("Error during login query:", err); // Log database query error
      return res.status(500).send("An error occurred."); // Handle database errors
    }

    if (results.length === 0) {
      console.log("No user found with the provided email."); // Log invalid email
      return res.status(401).send("Invalid email or password."); // Handle invalid email
    }

    const user = results[0];
    console.log("User found:", user); // Log user data (excluding password)

    const isPasswordValid = await bcrypt.compare(password, user.password); // Compare hashed passwords
    if (!isPasswordValid) {
      console.log("Invalid password provided."); // Log invalid password
      return res.status(401).send("Invalid email or password."); // Handle invalid password
    }

    console.log("Login successful for user:", user.email); // Log successful login
    res.status(200).json({ role: user.role }); // Return user role on successful login
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
