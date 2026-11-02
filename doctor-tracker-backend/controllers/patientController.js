const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");

// CREATE PATIENT
exports.createPatient = async (req, res) => {
    try {
        const {
            name,
            age,
            gender,
            phone,
            email,
            condition,
            doctor
        } = req.body;

        const existingDoctor = await Doctor.findById(doctor);

        if (!existingDoctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor Not Found"
            });
        }

        const patient = await Patient.create({
            name,
            age,
            gender,
            phone,
            email,
            condition,
            doctor
        });

        res.status(201).json({
            success: true,
            message: "Patient Created Successfully",
            data: patient
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// GET ALL PATIENTS WITH SEARCH AND FILTER
exports.getPatients = async (req, res) => {
    try {
        const {
            search,
            condition,
            doctor,
            startDate,
            endDate,
            page = 1,
            limit = 10
        } = req.query;

        const filter = {};

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
                { condition: { $regex: search, $options: "i" } }
            ];
        }

        if (condition) {
            filter.condition = {
                $regex: condition,
                $options: "i"
            };
        }

        if (doctor) {
            filter.doctor = doctor;
        }

        if (startDate || endDate) {
            filter.createdAt = {};

            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        const currentPage = Math.max(1, Number(page) || 1);
        const pageLimit = Math.min(100, Math.max(1, Number(limit) || 10));

        const total = await Patient.countDocuments(filter);

        const patients = await Patient.find(filter)
            .populate("doctor", "name specialization hospital")
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * pageLimit)
            .limit(pageLimit);

        res.status(200).json({
            success: true,
            total,
            currentPage,
            totalPages: Math.ceil(total / pageLimit),
            data: patients
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// GET PATIENT BY ID
exports.getPatientById = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id)
            .populate("doctor", "name specialization hospital");

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient Not Found"
            });
        }

        res.status(200).json({
            success: true,
            data: patient
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// UPDATE PATIENT
exports.updatePatient = async (req, res) => {
    try {
        if (req.body.doctor) {
            const existingDoctor = await Doctor.findById(req.body.doctor);

            if (!existingDoctor) {
                return res.status(404).json({
                    success: false,
                    message: "Doctor Not Found"
                });
            }
        }

        const patient = await Patient.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        ).populate("doctor", "name specialization hospital");

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient Not Found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Patient Updated Successfully",
            data: patient
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// DELETE PATIENT
exports.deletePatient = async (req, res) => {
    try {
        const patient = await Patient.findByIdAndDelete(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient Not Found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Patient Deleted Successfully"
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};