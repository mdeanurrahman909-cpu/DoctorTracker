console.log("DOCTOR CONTROLLER FILE:", __filename);
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

// CREATE DOCTOR
exports.createDoctor = async (req, res) => {
    try {
        const { name, specialization, hospital, phone, email } = req.body;

        const doctor = await Doctor.create({
            name,
            specialization,
            hospital,
            phone,
            email
        });

        res.status(201).json({
            success: true,
            message: "Doctor Created Successfully",
            data: doctor
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// GET ALL DOCTORS WITH SEARCH, DATE FILTER AND PAGINATION
exports.getDoctors = async (req, res) => {
    try {
        console.log("UPDATED DOCTOR CONTROLLER IS RUNNING");
        console.log("NEW GET DOCTOR BY ID FUNCTION RUNNING");

        const {
            search,
            startDate,
            endDate,
            page = 1,
            limit = 5
        } = req.query;

        const filter = {};

        // SEARCH FILTER
        if (search && search.trim()) {
            const searchText = search.trim();

            filter.$or = [
                { name: { $regex: searchText, $options: "i" } },
                { specialization: { $regex: searchText, $options: "i" } },
                { hospital: { $regex: searchText, $options: "i" } },
                { phone: { $regex: searchText, $options: "i" } },
                { email: { $regex: searchText, $options: "i" } }
            ];
        }

        // DATE FILTER
        if (startDate || endDate) {
            filter.createdAt = {};

            if (startDate) {
                const start = new Date(startDate);

                if (isNaN(start.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid start date"
                    });
                }

                filter.createdAt.$gte = start;
            }

            if (endDate) {
                const end = new Date(endDate);

                if (isNaN(end.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid end date"
                    });
                }

                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        // PAGINATION SETTINGS
        const currentPage = Math.max(1, Number(page) || 1);
        const pageLimit = Math.min(100, Math.max(1, Number(limit) || 5));

        // TOTAL DOCTORS
        const total = await Doctor.countDocuments(filter);

        // TOTAL PAGES
        const totalPages = Math.max(
            1,
            Math.ceil(total / pageLimit)
        );

        // GET DOCTORS
        const doctors = await Doctor.find(filter)
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * pageLimit)
            .limit(pageLimit);

        console.log("DOCTOR PAGINATION DATA:", {
            total,
            currentPage,
            totalPages,
            pageLimit
        });

        // SUCCESS RESPONSE
        return res.status(200).json({
            success: true,
            total: total,
            currentPage: currentPage,
            totalPages: totalPages,
            limit: pageLimit,
            data: doctors
        });

    } catch (error) {
        console.error("GET DOCTORS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// GET SINGLE DOCTOR WITH PATIENTS
exports.getDoctorById = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor Not Found"
            });
        }

        const patients = await Patient.find({
            doctor: doctor._id
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                doctor,
                patients,
                totalPatients: patients.length
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// UPDATE DOCTOR
exports.updateDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor Not Found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Doctor Updated Successfully",
            data: doctor
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};


// DELETE DOCTOR
exports.deleteDoctor = async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: "Doctor Not Found"
            });
        }

        // CHECK RELATED PATIENTS
        const patientCount = await Patient.countDocuments({
            doctor: doctor._id
        });

        // PREVENT DELETION IF PATIENTS EXIST
        if (patientCount > 0) {
            return res.status(400).json({
                success: false,
                message: `This doctor has ${patientCount} registered patient(s). Please reassign or remove those patients before deleting the doctor.`
            });
        }

        await Doctor.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Doctor Deleted Successfully"
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

