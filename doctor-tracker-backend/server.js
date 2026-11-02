
console.log("DOCTOR TRACKER BACKEND FILE:", __filename);
require("dns").setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const patientRoutes = require("./routes/patientRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect MongoDB
connectDB();

// Authentication API Routes
app.use("/api/auth", authRoutes);

// Doctor API Routes
app.use("/api/doctors", doctorRoutes);
// Authentication Test
app.get("/api/test-security", (req, res) => {
    res.json({
        securityMiddleware: require("./middleware/authMiddleware").protect.toString()
    });
});

// Patient API Routes
app.use("/api/patients", patientRoutes);

// Dashboard API Routes
app.use("/api/dashboard", dashboardRoutes);

// Test API
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Doctor Tracker Backend API is Running!"
    });
});

// Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
