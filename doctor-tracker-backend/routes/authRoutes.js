const express = require("express");

const router = express.Router();

const {
    registerAdmin,
    loginAdmin
} = require("../controllers/authController");

// ADMIN REGISTER
router.post("/register", registerAdmin);

// ADMIN LOGIN
router.post("/login", loginAdmin);

module.exports = router;