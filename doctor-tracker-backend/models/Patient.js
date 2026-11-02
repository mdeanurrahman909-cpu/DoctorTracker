const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        age: {
            type: Number,
            required: true,
            min: 0
        },

        gender: {
            type: String,
            required: true,
            enum: ["Male", "Female", "Other"]
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            lowercase: true,
            trim: true
        },

        condition: {
            type: String,
            required: true,
            trim: true
        },

        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Doctor",
            required: true
        }
    },
    {
        timestamps: true
    }
);

patientSchema.index({ doctor: 1, createdAt: -1 });
patientSchema.index({ name: 1 });

const Patient = mongoose.model("Patient", patientSchema);

module.exports = Patient;