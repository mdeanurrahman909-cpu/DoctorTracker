const express = require("express");
const router = express.Router();

const {
    createDoctor,
    getDoctors,
    getDoctorById,
    updateDoctor,
    deleteDoctor
} = require("../controllers/doctorController");

const { protect } = require("../middleware/authMiddleware");

// Protected Doctor Routes
router.post("/", protect, createDoctor);
router.get("/", protect, getDoctors);
router.get("/:id", protect, (req, res, next) => {
    console.log("DOCTOR ID ROUTE IS RUNNING");
    next();
}, getDoctorById);
router.put("/:id", protect, updateDoctor);
router.delete("/:id", protect, deleteDoctor);

module.exports = router;