const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

// DASHBOARD STATISTICS
exports.getDashboardStats = async (req, res) => {
    try {
        const totalDoctors = await Doctor.countDocuments();
        const totalPatients = await Patient.countDocuments();

        // PATIENTS PER DOCTOR
        const patientsPerDoctor = await Patient.aggregate([
            {
                $group: {
                    _id: "$doctor",
                    totalPatients: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "doctors",
                    localField: "_id",
                    foreignField: "_id",
                    as: "doctor"
                }
            },
            {
                $unwind: "$doctor"
            },
            {
                $project: {
                    _id: 0,
                    doctorId: "$doctor._id",
                    doctorName: "$doctor.name",
                    specialization: "$doctor.specialization",
                    totalPatients: 1
                }
            }
        ]);

        // DATE-WISE PATIENT STATISTICS
        const dateWisePatients = await Patient.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    totalPatients: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
            }
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalDoctors,
                totalPatients,
                patientsPerDoctor,
                dateWisePatients
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};