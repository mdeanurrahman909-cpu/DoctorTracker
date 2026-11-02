"use client";

import { useState, useEffect } from "react";

const doctors = [
  { name: "Dr. Sarah Johnson", specialty: "Cardiologist", patients: 124, status: "Available", color: "bg-blue-100 text-blue-700" },
  { name: "Dr. Michael Chen", specialty: "Neurologist", patients: 98, status: "Available", color: "bg-purple-100 text-purple-700" },
  { name: "Dr. Emily Williams", specialty: "Pediatrician", patients: 86, status: "Busy", color: "bg-pink-100 text-pink-700" },
  { name: "Dr. James Wilson", specialty: "Orthopedic", patients: 72, status: "Available", color: "bg-green-100 text-green-700" },
];

const patients = [
  { name: "John Anderson", id: "PT-1001", doctor: "Dr. Sarah Johnson", date: "Oct 30, 2026", status: "Active" },
  { name: "Sophia Martinez", id: "PT-1002", doctor: "Dr. Michael Chen", date: "Oct 29, 2026", status: "Active" },
  { name: "Robert Taylor", id: "PT-1003", doctor: "Dr. Emily Williams", date: "Oct 28, 2026", status: "Pending" },
  { name: "Olivia Brown", id: "PT-1004", doctor: "Dr. James Wilson", date: "Oct 27, 2026", status: "Active" },
];

const stats = [
  { title: "Total Doctors", value: "48", change: "+12.5%", icon: "⚕", color: "bg-blue-50 text-blue-600" },
  { title: "Total Patients", value: "1,284", change: "+8.2%", icon: "♙", color: "bg-purple-50 text-purple-600" },
  { title: "Appointments", value: "356", change: "+15.3%", icon: "▣", color: "bg-orange-50 text-orange-600" },
  { title: "Available Doctors", value: "32", change: "Currently online", icon: "♥", color: "bg-green-50 text-green-600" },
];

export default function Dashboard() {
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [dashboardStats, setDashboardStats] = useState({
      totalDoctors: 0,
      totalPatients: 0,
      patientsPerDoctor: [],
      dateWisePatients: [],
  });

  useEffect(() => {
      const savedToken = localStorage.getItem("doctorTrackerToken");

      if (savedToken) {
          setAuthToken(savedToken);
          setIsLoggedIn(true);
      }
  }, []);

  useEffect(() => {
      const fetchDashboardStats = async () => {
          if (!authToken) return;

          try {
              const response = await fetch(
                  "http://localhost:5000/api/dashboard/stats",
                  {
                      method: "GET",
                      headers: {
                          Authorization: `Bearer ${authToken}`,
                      },
                  }
              );

              const result = await response.json();
              console.log("FULL DOCTOR API RESPONSE:", JSON.stringify(result, null, 2));

              if (!response.ok) {
                  throw new Error(result.message || "Dashboard API Failed");
              }

              setDashboardStats(result.data);

              console.log("Dashboard Statistics Loaded:", result.data);

          } catch (error) {
              console.error("Dashboard Statistics Error:", error);
          }
      };

      fetchDashboardStats();
  }, [authToken]);

  const handleLogin = async (e) => {
      e.preventDefault();

      setLoginError("");
      setLoginLoading(true);

      try {
          const response = await fetch("http://localhost:5000/api/auth/login", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  email: loginEmail,
                  password: loginPassword,
              }),
          });

          const data = await response.json();

          if (!response.ok) {
              throw new Error(data.message || "Login Failed");
          }

          localStorage.setItem("doctorTrackerToken", data.token);

          setAuthToken(data.token);
          setIsLoggedIn(true);

      } catch (error) {
          setLoginError(error.message);
      } finally {
          setLoginLoading(false);
      }
  };

  // ADD AND UPDATE DOCTOR
  const handleDoctorSubmit = async (e) => {
      e.preventDefault();

      setDoctorLoading(true);
      setDoctorError("");

      try {
          const isEditing = Boolean(editingDoctorId);

          const response = await fetch(
              isEditing
                  ? `http://localhost:5000/api/doctors/${editingDoctorId}`
                  : "http://localhost:5000/api/doctors",
              {
                  method: isEditing ? "PUT" : "POST",
                  headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${authToken}`,
                  },
                  body: JSON.stringify(doctorForm),
              }
          );

          const result = await response.json();

          if (!response.ok) {
              throw new Error(
                  result.message ||
                  (isEditing ? "Doctor Update Failed" : "Doctor Add Failed")
              );
          }

          alert(
              isEditing
                  ? "Doctor Updated Successfully!"
                  : "Doctor Added Successfully!"
          );

          setDoctorForm(emptyDoctorForm);
          setShowDoctorForm(false);
          setEditingDoctorId(null);

          // REFRESH DOCTOR LIST
          const queryParams = new URLSearchParams({
              page: doctorPage,
              limit: doctorLimit,
          });

          if (doctorSearch) {
              queryParams.append("search", doctorSearch);
          }

          if (doctorStartDate) {
              queryParams.append("startDate", doctorStartDate);
          }

          if (doctorEndDate) {
              queryParams.append("endDate", doctorEndDate);
          }

          const doctorResponse = await fetch(
              `http://localhost:5000/api/doctors?${queryParams.toString()}`,
              {
                  headers: {
                      Authorization: `Bearer ${authToken}`,
                  },
              }
          );

          const doctorResult = await doctorResponse.json();

          if (!doctorResponse.ok) {
              throw new Error(doctorResult.message || "Doctor List Refresh Failed");
          }

          setDoctorList(doctorResult.data || []);
          setDoctorTotalPages(doctorResult.totalPages || 1);

          // Refresh Dashboard Statistics
          const statsResponse = await fetch(
              "http://localhost:5000/api/dashboard/stats",
              {
                  headers: {
                      Authorization: `Bearer ${authToken}`,
                  },
              }
          );

          const statsResult = await statsResponse.json();

          if (statsResponse.ok) {
              setDashboardStats(statsResult.data);
          }

      } catch (error) {
          setDoctorError(error.message);
      } finally {
          setDoctorLoading(false);
      }
  };

  // ADD NEW PATIENT
  const handlePatientSubmit = async (e) => {
      e.preventDefault();

      setPatientLoading(true);
      setPatientError("");

      try {
          const isEditing = Boolean(editingPatientId);

          const response = await fetch(
              isEditing
                  ? `http://localhost:5000/api/patients/${editingPatientId}`
                  : "http://localhost:5000/api/patients",
              {
                  method: isEditing ? "PUT" : "POST",
                  headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${authToken}`,
                  },
                  body: JSON.stringify({
                      ...patientForm,
                      age: Number(patientForm.age),
                  }),
              }
          );

          const result = await response.json();

          if (!response.ok) {
              throw new Error(result.message || "Patient Add Failed");
          }

          alert(
              isEditing
                  ? "Patient Updated Successfully!"
                  : "Patient Added Successfully!"
          );

          setPatientForm(emptyPatientForm);
          setShowPatientForm(false);
          setEditingPatientId(null);

          // Refresh Patient List
          const patientResponse = await fetch(
              "http://localhost:5000/api/patients",
              {
                  headers: {
                      Authorization: `Bearer ${authToken}`,
                  },
              }
          );

          const patientResult = await patientResponse.json();

          if (!patientResponse.ok) {
              throw new Error(patientResult.message || "Patient List Refresh Failed");
          }

          setPatientList(patientResult.data || []);

          // REFRESH SELECTED DOCTOR DETAILS
          if (selectedDoctor?.doctor?._id) {
              const doctorResponse = await fetch(
                  `http://localhost:5000/api/doctors/${selectedDoctor.doctor._id}`,
                  {
                      headers: {
                          Authorization: `Bearer ${authToken}`,
                      },
                  }
              );

              const doctorResult = await doctorResponse.json();

              if (doctorResponse.ok) {
                  setSelectedDoctor(doctorResult.data);
              }
          }

          // Refresh Dashboard Statistics
          const statsResponse = await fetch(
              "http://localhost:5000/api/dashboard/stats",
              {
                  headers: {
                      Authorization: `Bearer ${authToken}`,
                  },
              }
          );

          const statsResult = await statsResponse.json();

          if (statsResponse.ok) {
              setDashboardStats(statsResult.data);
          }

      } catch (error) {
          setPatientError(error.message);
      } finally {
          setPatientLoading(false);
      }
  };

  // DELETE PATIENT
  const handleDeletePatient = async (id) => {
      const confirmed = window.confirm(
          "Are you sure you want to delete this patient?"
      );

      if (!confirmed) return;

      try {
          const response = await fetch(
              `http://localhost:5000/api/patients/${id}`,
              {
                  method: "DELETE",
                  headers: {
                      Authorization: `Bearer ${authToken}`,
                  },
              }
          );

          const result = await response.json();

          if (!response.ok) {
              throw new Error(result.message || "Patient Delete Failed");
          }

          setPatientList((previousPatients) =>
              previousPatients.filter((patient) => patient._id !== id)
          );

          // Refresh Dashboard Statistics
          const statsResponse = await fetch(
              "http://localhost:5000/api/dashboard/stats",
              {
                  headers: {
                      Authorization: `Bearer ${authToken}`,
                  },
              }
          );

          const statsResult = await statsResponse.json();

          if (statsResponse.ok) {
              setDashboardStats(statsResult.data);
          }

          alert("Patient Deleted Successfully!");

      } catch (error) {
          alert(error.message);
      }
  };

  // DELETE DOCTOR
  const handleDeleteDoctor = async (doctorId) => {
      const confirmed = window.confirm(
          "Are you sure you want to delete this doctor?"
      );

      if (!confirmed) return;

      try {
          const response = await fetch(
              `http://localhost:5000/api/doctors/${doctorId}`,
              {
                  method: "DELETE",
                  headers: {
                      Authorization: `Bearer ${authToken}`,
                  },
              }
          );

          const result = await response.json();

          if (!response.ok) {
              throw new Error(result.message || "Doctor Delete Failed");
          }

          // REFRESH DOCTOR LIST
          const queryParams = new URLSearchParams({
              page: doctorPage,
              limit: doctorLimit,
          });

          if (doctorSearch) {
              queryParams.append("search", doctorSearch);
          }

          if (doctorStartDate) {
              queryParams.append("startDate", doctorStartDate);
          }

          if (doctorEndDate) {
              queryParams.append("endDate", doctorEndDate);
          }

          const doctorResponse = await fetch(
              `http://localhost:5000/api/doctors?${queryParams.toString()}`,
              {
                  headers: {
                      Authorization: `Bearer ${authToken}`,
                  },
              }
          );

          const doctorResult = await doctorResponse.json();

          if (!doctorResponse.ok) {
              throw new Error(
                  doctorResult.message || "Doctor List Refresh Failed"
              );
          }

          setDoctorList(doctorResult.data || []);
          setDoctorTotalPages(doctorResult.totalPages || 1);

          // CLOSE DETAILS IF DELETED DOCTOR WAS SELECTED
          if (selectedDoctor?.doctor?._id === doctorId) {
              setSelectedDoctor(null);
          }

          // REFRESH DASHBOARD STATISTICS
          const statsResponse = await fetch(
              "http://localhost:5000/api/dashboard/stats",
              {
                  headers: {
                      Authorization: `Bearer ${authToken}`,
                  },
              }
          );

          const statsResult = await statsResponse.json();

          if (statsResponse.ok) {
              setDashboardStats(statsResult.data);
          }

          alert("Doctor Deleted Successfully!");

      } catch (error) {
          alert(error.message);
      }
  };

  // EDIT DOCTOR
  const handleEditDoctor = (doctor) => {
      setEditingDoctorId(doctor._id);

      setDoctorForm({
          name: doctor.name || "",
          specialization: doctor.specialization || "",
          hospital: doctor.hospital || "",
          phone: doctor.phone || "",
          email: doctor.email || "",
      });

      setDoctorError("");
      setShowDoctorForm(true);
  };

  // VIEW DOCTOR DETAILS WITH PATIENTS
  const handleViewDoctorDetails = async (doctorId) => {
      setDoctorDetailsLoading(true);
      setDoctorDetailsError("");
      setSelectedDoctor(null);

      try {
          const response = await fetch(
              `http://localhost:5000/api/doctors/${doctorId}`,
              {
                  method: "GET",
                  headers: {
                      Authorization: `Bearer ${authToken}`,
                  },
              }
          );

          const result = await response.json();

          if (!response.ok) {
              throw new Error(
                  result.message || "Failed to load doctor details"
              );
          }

          setSelectedDoctor(result.data);
      } catch (error) {
          setDoctorDetailsError(error.message);
      } finally {
          setDoctorDetailsLoading(false);
      }
  };

  // EDIT PATIENT
  const handleEditPatient = (patient) => {
      setEditingPatientId(patient._id);

      setPatientForm({
          name: patient.name || "",
          age: patient.age || "",
          gender: patient.gender || "Male",
          phone: patient.phone || "",
          email: patient.email || "",
          condition: patient.condition || "",
          doctor: patient.doctor?._id || "",
      });

      setShowPatientForm(true);
  };

  const [search, setSearch] = useState("");
  // DOCTOR PAGINATION AND FILTER STATES
const [doctorSearch, setDoctorSearch] = useState("");
const [doctorPage, setDoctorPage] = useState(1);
const [doctorLimit] = useState(5);
const [doctorTotalPages, setDoctorTotalPages] = useState(1);

const [doctorStartDate, setDoctorStartDate] = useState("");
const [doctorEndDate, setDoctorEndDate] = useState("");
  // DOCTOR FORM STATES
const [doctorList, setDoctorList] = useState([]);
const [showDoctorForm, setShowDoctorForm] = useState(false);
const [doctorLoading, setDoctorLoading] = useState(false);
const [doctorError, setDoctorError] = useState("");
// DOCTOR EDIT STATE
const [editingDoctorId, setEditingDoctorId] = useState(null);
// DOCTOR DETAILS STATES
const [selectedDoctor, setSelectedDoctor] = useState(null);
const [doctorDetailsLoading, setDoctorDetailsLoading] = useState(false);
const [doctorDetailsError, setDoctorDetailsError] = useState("");

const emptyDoctorForm = {
    name: "",
    specialization: "",
    hospital: "",
    phone: "",
    email: "",
};

const [doctorForm, setDoctorForm] = useState(emptyDoctorForm);
// PATIENT FORM STATES
const [patientList, setPatientList] = useState([]);
// PATIENT PAGINATION STATES
const [patientPage, setPatientPage] = useState(1);
const [patientLimit] = useState(5);
const [patientTotalPages, setPatientTotalPages] = useState(1);
// PATIENT CONDITION FILTER
const [patientCondition, setPatientCondition] = useState("");
// PATIENT DATE FILTER
const [patientStartDate, setPatientStartDate] = useState("");
const [patientEndDate, setPatientEndDate] = useState("");
const [showPatientForm, setShowPatientForm] = useState(false);
const [editingPatientId, setEditingPatientId] = useState(null);
const [patientLoading, setPatientLoading] = useState(false);
const [patientError, setPatientError] = useState("");

const emptyPatientForm = {
    name: "",
    age: "",
    gender: "Male",
    phone: "",
    email: "",
    condition: "",
    doctor: "",
};

const [patientForm, setPatientForm] = useState(emptyPatientForm);
// FETCH PATIENTS FROM BACKEND WITH PAGINATION
useEffect(() => {
    const fetchPatients = async () => {
        if (!authToken) return;

        try {
            const queryParams = new URLSearchParams({
                page: patientPage,
                limit: patientLimit,
            });

            if (patientCondition) {
                queryParams.append("condition", patientCondition);
            }

            if (patientStartDate) {
                queryParams.append("startDate", patientStartDate);
            }

            if (patientEndDate) {
                queryParams.append("endDate", patientEndDate);
            }

            const response = await fetch(
                `http://localhost:5000/api/patients?${queryParams.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to load patients");
            }

            setPatientList(result.data || []);

            setPatientTotalPages(
                result.totalPages || 1
            );

            console.log("Patients Loaded:", result);

        } catch (error) {
            console.error("Patient List Error:", error);
            setPatientError(error.message);
        }
    };

    fetchPatients();
}, [
    authToken,
    patientPage,
    patientLimit,
    patientCondition,
    patientStartDate,
    patientEndDate
]);
// FETCH DOCTORS FROM BACKEND WITH PAGINATION, SEARCH AND DATE FILTER
useEffect(() => {
    const fetchDoctors = async () => {
        if (!authToken) return;

        try {
            const queryParams = new URLSearchParams({
                page: doctorPage,
                limit: doctorLimit,
            });

            if (doctorSearch) {
                queryParams.append("search", doctorSearch);
            }

            if (doctorStartDate) {
                queryParams.append("startDate", doctorStartDate);
            }

            if (doctorEndDate) {
                queryParams.append("endDate", doctorEndDate);
            }

            const response = await fetch(
                `http://localhost:5000/api/doctors?${queryParams.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );

            const result = await response.json();

            console.log(
                "DOCTOR LIST API RESPONSE:",
                JSON.stringify(result, null, 2)
            );

            if (!response.ok) {
                throw new Error(result.message || "Failed to load doctors");
            }

            setDoctorList(Array.isArray(result.data) ? result.data : []);
            setDoctorTotalPages(result.totalPages || 1);

            console.log("Doctor Total:", result.total);
            console.log("Doctor Total Pages:", result.totalPages);
            console.log("Doctors Loaded:", result);

        } catch (error) {
            console.error("Doctor List Error:", error);
            setDoctorError(error.message);
        }
    };

    fetchDoctors();
}, [
    authToken,
    doctorPage,
    doctorLimit,
    doctorSearch,
    doctorStartDate,
    doctorEndDate
]);

  const menuItems = [
    { name: "Dashboard", icon: "▦" },
    { name: "Doctors", icon: "⚕" },
    { name: "Patients", icon: "♙" },
  ];

  return (
    !isLoggedIn ? (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-md bg-slate-900 p-8 rounded-2xl border border-slate-700 shadow-2xl">

                <h1 className="text-3xl font-bold text-white text-center mb-2">
                    DoctorTracker
                </h1>

                <p className="text-slate-400 text-center mb-8">
                    Admin Login
                </p>

                <form onSubmit={handleLogin} className="space-y-5">

                    <div>
                        <label className="block text-slate-300 mb-2">
                            Email Address
                        </label>

                        <input
                            type="email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            className="w-full p-3 rounded-lg bg-slate-800 text-white border border-slate-700 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-300 mb-2">
                            Password
                        </label>

                        <input
                            type="password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            className="w-full p-3 rounded-lg bg-slate-800 text-white border border-slate-700 outline-none"
                        />
                    </div>

                    {loginError && (
                        <p className="text-red-400 text-sm">
                            {loginError}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loginLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded-lg disabled:opacity-50"
                    >
                        {loginLoading ? "Logging in..." : "Login"}
                    </button>

                </form>
            </div>
        </div>
    ) : (
    <div className="min-h-screen bg-[#f5f7fb] text-gray-800">

      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="hidden w-64 shrink-0 flex-col bg-[#172554] text-white md:flex">

          <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-2xl">
              ✚
            </div>
            <div>
              <h1 className="text-xl font-bold">DoctorTracker</h1>
              <p className="text-xs text-blue-200">Healthcare Management</p>
            </div>
          </div>

          <div className="px-5 pt-8">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-blue-300">
              Main Menu
            </p>

            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setActiveMenu(item.name)}
                  className={`flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left transition ${
                    activeMenu === item.name
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-blue-100 hover:bg-white/10"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm font-medium">{item.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-auto border-t border-white/10 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 font-bold">
                A
              </div>
              <div>
                <p className="text-sm font-semibold">Admin User</p>
                <p className="text-xs text-blue-200">Administrator</p>
              </div>
            </div>
          </div>

        </aside>

        {/* MAIN CONTENT */}
        <main className="min-w-0 flex-1">

          {/* HEADER */}
          <header className="flex h-20 items-center justify-between border-b border-gray-200 bg-white px-5 md:px-8">

            <div>
              <h2 className="text-xl font-bold md:text-2xl">
                {activeMenu}
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Welcome back! Here is your hospital overview.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-gray-500 sm:block">
                October 31, 2026
              </span>
              <button className="relative rounded-xl bg-gray-100 p-3">
                🔔
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                A
              </div>
            </div>

          </header>

          {/* PAGE CONTENT */}
          <div className="p-5 md:p-8">

            {/* DASHBOARD */}
            {activeMenu === "Dashboard" && (
              <>
                <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold">Dashboard Overview</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Monitor your healthcare management system.
                    </p>
                  </div>

                  <button className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700">
                    + Add New Doctor
                  </button>
                </div>

                {/* STATISTICS */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {stats.map((stat) => (
                    <div key={stat.title} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">{stat.title}</p>
                          <h3 className="mt-3 text-3xl font-bold">
                              {stat.title === "Total Doctors"
                                  ? dashboardStats.totalDoctors
                                  : stat.title === "Total Patients"
                                  ? dashboardStats.totalPatients
                                  : stat.value}
                          </h3>
                        </div>
                        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${stat.color}`}>
                          {stat.icon}
                        </div>
                      </div>
                      <p className="mt-4 text-xs font-semibold text-green-600">
                        ↑ {stat.change}
                      </p>
                    </div>
                  ))}
                </div>

                {/* CHARTS */}
                <div className="mt-7 grid grid-cols-1 gap-6 xl:grid-cols-3">

                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm xl:col-span-2">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">Patient Statistics</h3>
                        <p className="mt-1 text-xs text-gray-500">
                          Monthly patient overview
                        </p>
                      </div>
                      <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs">
                        This Year
                      </span>
                    </div>

                    <div className="flex h-56 items-end justify-around gap-3 border-b border-gray-200 px-2">
                      {[45, 65, 50, 80, 60, 95, 72, 85, 65, 100, 78, 90].map((height, i) => (
                        <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                          <div
                            className="w-full max-w-10 rounded-t-lg bg-blue-500 transition hover:bg-blue-700"
                            style={{ height: `${height}%` }}
                          ></div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex justify-around text-xs text-gray-400">
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                        <span key={m}>{m}</span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                    <h3 className="font-bold">Patient Distribution</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      By department
                    </p>

                    <div className="my-8 flex justify-center">
                      <div className="flex h-44 w-44 items-center justify-center rounded-full"
                        style={{
                          background: "conic-gradient(#2563eb 0% 35%, #8b5cf6 35% 60%, #f59e0b 60% 80%, #10b981 80% 100%)"
                        }}
                      >
                        <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                          <span className="text-2xl font-bold">1,284</span>
                          <span className="text-xs text-gray-500">Patients</span>
                        </div>
                      </div>
                    </div>

                    {[
                      ["Cardiology", "35%", "bg-blue-600"],
                      ["Neurology", "25%", "bg-purple-500"],
                      ["Pediatrics", "20%", "bg-amber-500"],
                      ["Others", "20%", "bg-green-500"],
                    ].map(([name, percent, color]) => (
                      <div key={name} className="mb-3 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`h-3 w-3 rounded-full ${color}`}></span>
                          {name}
                        </div>
                        <span className="font-semibold">{percent}</span>
                      </div>
                    ))}
                  </div>

                </div>

                {/* DOCTOR TABLE */}
                <div className="mt-7 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold">Recent Doctors</h3>
                      <p className="mt-1 text-xs text-gray-500">Doctor information overview</p>
                    </div>
                    <button onClick={() => setActiveMenu("Doctors")} className="text-sm font-semibold text-blue-600">
                      View All →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left text-sm">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                          <th className="rounded-l-lg p-4">Doctor Name</th>
                          <th className="p-4">Specialization</th>
                          <th className="p-4">Patients</th>
                          <th className="rounded-r-lg p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doctors.map((doctor) => (
                          <tr key={doctor.name} className="border-b border-gray-100">
                            <td className="p-4 font-semibold">{doctor.name}</td>
                            <td className="p-4 text-gray-500">{doctor.specialty}</td>
                            <td className="p-4">{doctor.patients}</td>
                            <td className="p-4">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${doctor.color}`}>
                                {doctor.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* PATIENT TABLE */}
                <div className="mt-7 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold">Recent Patients</h3>
                      <p className="mt-1 text-xs text-gray-500">Recently registered patients</p>
                    </div>
                    <button onClick={() => setActiveMenu("Patients")} className="text-sm font-semibold text-blue-600">
                      View All →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] text-left text-sm">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                        <tr>
                          <th className="rounded-l-lg p-4">Patient</th>
                          <th className="p-4">Patient ID</th>
                          <th className="p-4">Doctor</th>
                          <th className="p-4">Date</th>
                          <th className="rounded-r-lg p-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patients.map((patient) => (
                          <tr key={patient.id} className="border-b border-gray-100">
                            <td className="p-4 font-semibold">{patient.name}</td>
                            <td className="p-4 text-gray-500">{patient.id}</td>
                            <td className="p-4">{patient.doctor}</td>
                            <td className="p-4 text-gray-500">{patient.date}</td>
                            <td className="p-4">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                patient.status === "Active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-orange-100 text-orange-700"
                              }`}>
                                {patient.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </>
            )}

            {/* DOCTORS PAGE */}
            {activeMenu === "Doctors" && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold">Doctor Management</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage all registered doctors.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setEditingDoctorId(null);
                            setDoctorForm(emptyDoctorForm);
                            setDoctorError("");
                            setShowDoctorForm(true);
                        }}
                        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        + Add New Doctor
                    </button>
                </div>

                {showDoctorForm && (
                    <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-6">
                        <h3 className="mb-5 text-lg font-bold">
                            {editingDoctorId ? "Edit Doctor" : "Add New Doctor"}
                        </h3>

                        <form onSubmit={handleDoctorSubmit}>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                                {[
                                    ["name", "Doctor Name"],
                                    ["specialization", "Specialization"],
                                    ["hospital", "Hospital Name"],
                                    ["phone", "Phone Number"],
                                    ["email", "Email Address"],
                                ].map(([field, label]) => (
                                    <div key={field}>
                                        <label className="mb-2 block text-sm font-medium">
                                            {label}
                                        </label>

                                        <input
                                            type={field === "email" ? "email" : "text"}
                                            value={doctorForm[field]}
                                            onChange={(e) =>
                                                setDoctorForm({
                                                    ...doctorForm,
                                                    [field]: e.target.value,
                                                })
                                            }
                                            placeholder={`Enter ${label}`}
                                            required
                                            className="w-full rounded-xl border border-gray-200 bg-white p-3 outline-none focus:border-blue-500"
                                        />
                                    </div>
                                ))}

                            </div>

                            {doctorError && (
                                <p className="mt-4 text-sm text-red-600">
                                    {doctorError}
                                </p>
                            )}

                            <div className="mt-6 flex gap-3">
                                <button
                                    type="submit"
                                    disabled={doctorLoading}
                                    className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {doctorLoading
                                        ? "Saving..."
                                        : editingDoctorId
                                        ? "Update Doctor"
                                        : "Save Doctor"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDoctorForm(false);
                                        setDoctorError("");
                                        setDoctorForm(emptyDoctorForm);
                                        setEditingDoctorId(null);
                                    }}
                                    className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* DOCTOR SEARCH AND DATE FILTER */}
                <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">

                    <input
                        type="text"
                        placeholder="Search doctors..."
                        value={doctorSearch}
                        onChange={(e) => {
                            setDoctorSearch(e.target.value);
                            setDoctorPage(1);
                        }}
                        className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-blue-500"
                    />

                    <input
                        type="date"
                        value={doctorStartDate}
                        onChange={(e) => {
                            setDoctorStartDate(e.target.value);
                            setDoctorPage(1);
                        }}
                        className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-blue-500"
                    />

                    <input
                        type="date"
                        value={doctorEndDate}
                        onChange={(e) => {
                            setDoctorEndDate(e.target.value);
                            setDoctorPage(1);
                        }}
                        className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-blue-500"
                    />

                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[550px] text-left text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4">Doctor Name</th>
                            <th className="p-4">Specialization</th>
                            <th className="p-4">Hospital</th>
                            <th className="p-4">Phone</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {doctorList
                            .filter(d =>
                                d.name?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
                                d.specialization?.toLowerCase().includes(doctorSearch.toLowerCase()) ||
                                d.hospital?.toLowerCase().includes(doctorSearch.toLowerCase())
                            )
                            .map(d => (
                                <tr key={d._id} className="border-b">
                                    <td className="p-4 font-semibold">{d.name}</td>
                                    <td className="p-4">{d.specialization}</td>
                                    <td className="p-4">{d.hospital}</td>
                                    <td className="p-4">{d.phone}</td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-2">

                                            {/* EDIT BUTTON */}
                                            <button
                                                type="button"
                                                onClick={() => handleEditDoctor(d)}
                                                className="rounded-lg bg-green-100 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-200"
                                            >
                                                Edit
                                            </button>

                                            {/* VIEW DETAILS BUTTON */}
                                            <button
                                                type="button"
                                                onClick={() => handleViewDoctorDetails(d._id)}
                                                className="rounded-lg bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-200"
                                            >
                                                View Details
                                            </button>

                                            {/* DELETE BUTTON */}
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteDoctor(d._id)}
                                                className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-200"
                                            >
                                                Delete
                                            </button>

                                        </div>
                                    </td>
                                </tr>
                            ))}

                        {doctorList.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-5 text-center text-gray-500">
                                    No doctors found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                  </table>
                </div>

                {/* DOCTOR PAGINATION */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">

                    <p className="text-sm text-gray-500">
                        Page {doctorPage} of {doctorTotalPages}
                    </p>

                    <div className="flex gap-2">

                        <button
                            type="button"
                            onClick={() =>
                                setDoctorPage((previous) => Math.max(1, previous - 1))
                            }
                            disabled={doctorPage === 1}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold disabled:opacity-40"
                        >
                            Previous
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setDoctorPage((previous) =>
                                    Math.min(doctorTotalPages, previous + 1)
                                )
                            }
                            disabled={doctorPage >= doctorTotalPages}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                        >
                            Next
                        </button>

                    </div>
                </div>

                {/* DOCTOR DETAILS SECTION */}
                {doctorDetailsLoading && (
                    <div className="mt-6 rounded-xl bg-blue-50 p-5 text-center text-blue-600">
                        Loading Doctor Details...
                    </div>
                )}

                {doctorDetailsError && (
                    <div className="mt-6 rounded-xl bg-red-50 p-5 text-red-600">
                        {doctorDetailsError}
                    </div>
                )}

                {selectedDoctor && (
                    <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-6">

                        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="text-xl font-bold">
                                    Doctor Details
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Doctor information and registered patients.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedDoctor(null)}
                                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-300"
                            >
                                Close
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 rounded-xl bg-white p-5 md:grid-cols-2">

                            <p>
                                <strong>Doctor Name:</strong>{" "}
                                {selectedDoctor.doctor?.name || "N/A"}
                            </p>

                            <p>
                                <strong>Specialization:</strong>{" "}
                                {selectedDoctor.doctor?.specialization || "N/A"}
                            </p>

                            <p>
                                <strong>Hospital:</strong>{" "}
                                {selectedDoctor.doctor?.hospital || "N/A"}
                            </p>

                            <p>
                                <strong>Phone:</strong>{" "}
                                {selectedDoctor.doctor?.phone || "N/A"}
                            </p>

                            <p>
                                <strong>Email:</strong>{" "}
                                {selectedDoctor.doctor?.email || "N/A"}
                            </p>

                            <p>
                                <strong>Total Patients:</strong>{" "}
                                {selectedDoctor.totalPatients ?? 0}
                            </p>

                        </div>

                        {/* ADD PATIENT UNDER SELECTED DOCTOR */}
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">

                            <h4 className="text-lg font-bold">
                                Patients Under This Doctor
                            </h4>

                            <button
                                type="button"
                                onClick={() => {
                                    setPatientForm({
                                        ...emptyPatientForm,
                                        doctor: selectedDoctor.doctor._id,
                                    });

                                    setPatientError("");
                                    setEditingPatientId(null);
                                    setShowPatientForm(true);
                                }}
                                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                + Add Patient
                            </button>

                        </div>

                        {/* ADD PATIENT FORM */}
                        {showPatientForm && (
                            <div className="mt-5 rounded-2xl border border-blue-200 bg-white p-6">

                                <h4 className="mb-5 text-lg font-bold">
                                    Add Patient Under {selectedDoctor.doctor?.name}
                                </h4>

                                <form onSubmit={handlePatientSubmit}>

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                                        <div>
                                            <label className="mb-2 block text-sm font-medium">
                                                Patient Name
                                            </label>
                                            <input
                                                type="text"
                                                value={patientForm.name}
                                                onChange={(e) =>
                                                    setPatientForm({
                                                        ...patientForm,
                                                        name: e.target.value,
                                                    })
                                                }
                                                placeholder="Enter patient name"
                                                required
                                                className="w-full rounded-xl border border-gray-200 p-3"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium">
                                                Age
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={patientForm.age}
                                                onChange={(e) =>
                                                    setPatientForm({
                                                        ...patientForm,
                                                        age: e.target.value,
                                                    })
                                                }
                                                placeholder="Enter age"
                                                required
                                                className="w-full rounded-xl border border-gray-200 p-3"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium">
                                                Gender
                                            </label>
                                            <select
                                                value={patientForm.gender}
                                                onChange={(e) =>
                                                    setPatientForm({
                                                        ...patientForm,
                                                        gender: e.target.value,
                                                    })
                                                }
                                                className="w-full rounded-xl border border-gray-200 p-3"
                                            >
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium">
                                                Phone Number
                                            </label>
                                            <input
                                                type="text"
                                                value={patientForm.phone}
                                                onChange={(e) =>
                                                    setPatientForm({
                                                        ...patientForm,
                                                        phone: e.target.value,
                                                    })
                                                }
                                                placeholder="Enter phone number"
                                                required
                                                className="w-full rounded-xl border border-gray-200 p-3"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                value={patientForm.email}
                                                onChange={(e) =>
                                                    setPatientForm({
                                                        ...patientForm,
                                                        email: e.target.value,
                                                    })
                                                }
                                                placeholder="Enter email address"
                                                className="w-full rounded-xl border border-gray-200 p-3"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium">
                                                Patient Condition
                                            </label>
                                            <input
                                                type="text"
                                                value={patientForm.condition}
                                                onChange={(e) =>
                                                    setPatientForm({
                                                        ...patientForm,
                                                        condition: e.target.value,
                                                    })
                                                }
                                                placeholder="Enter patient condition"
                                                required
                                                className="w-full rounded-xl border border-gray-200 p-3"
                                            />
                                        </div>

                                    </div>

                                    <div className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
                                        Selected Doctor: <strong>{selectedDoctor.doctor?.name}</strong>
                                    </div>

                                    {patientError && (
                                        <p className="mt-4 text-sm text-red-600">
                                            {patientError}
                                        </p>
                                    )}

                                    <div className="mt-5 flex gap-3">

                                        <button
                                            type="submit"
                                            disabled={patientLoading}
                                            className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            {patientLoading ? "Saving..." : "Add Patient"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowPatientForm(false);
                                                setPatientError("");
                                            }}
                                            className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold"
                                        >
                                            Cancel
                                        </button>

                                    </div>

                                </form>

                            </div>
                        )}

                        <div className="overflow-x-auto rounded-xl bg-white">
                            <table className="w-full min-w-[600px] text-left text-sm">

                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="p-4">Patient Name</th>
                                        <th className="p-4">Age</th>
                                        <th className="p-4">Gender</th>
                                        <th className="p-4">Phone</th>
                                        <th className="p-4">Condition</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {selectedDoctor.patients?.map((patient) => (
                                        <tr key={patient._id} className="border-b">
                                            <td className="p-4 font-semibold">
                                                {patient.name}
                                            </td>
                                            <td className="p-4">
                                                {patient.age ?? "N/A"}
                                            </td>
                                            <td className="p-4">
                                                {patient.gender || "N/A"}
                                            </td>
                                            <td className="p-4">
                                                {patient.phone || "N/A"}
                                            </td>
                                            <td className="p-4">
                                                {patient.condition || "N/A"}
                                            </td>
                                        </tr>
                                    ))}

                                    {(!selectedDoctor.patients ||
                                        selectedDoctor.patients.length === 0) && (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="p-5 text-center text-gray-500"
                                            >
                                                No patients found for this doctor.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>

                            </table>
                        </div>

                    </div>
                )}

              </div>
            )}

            {/* PATIENTS PAGE */}
            {activeMenu === "Patients" && (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">Patient Management</h2>
                    <p className="mt-1 text-sm text-gray-500">Manage all registered patients.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPatientForm(emptyPatientForm);
                      setPatientError("");
                      setShowPatientForm(true);
                    }}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    + Add New Patient
                  </button>
                </div>

                {showPatientForm && (
                  <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-6">
                    <h3 className="mb-5 text-lg font-bold">
                      {editingPatientId ? "Edit Patient" : "Add New Patient"}
                    </h3>

                    <form onSubmit={handlePatientSubmit}>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                        <div>
                          <label className="mb-2 block text-sm font-medium">Patient Name</label>
                          <input
                            type="text"
                            value={patientForm.name}
                            onChange={(e) => setPatientForm({ ...patientForm, name: e.target.value })}
                            placeholder="Enter patient name"
                            required
                            className="w-full rounded-xl border border-gray-200 bg-white p-3 outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium">Age</label>
                          <input
                            type="number"
                            min="0"
                            value={patientForm.age}
                            onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                            placeholder="Enter age"
                            required
                            className="w-full rounded-xl border border-gray-200 bg-white p-3 outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium">Gender</label>
                          <select
                            value={patientForm.gender}
                            onChange={(e) => setPatientForm({ ...patientForm, gender: e.target.value })}
                            required
                            className="w-full rounded-xl border border-gray-200 bg-white p-3 outline-none focus:border-blue-500"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium">Phone Number</label>
                          <input
                            type="text"
                            value={patientForm.phone}
                            onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                            placeholder="Enter phone number"
                            required
                            className="w-full rounded-xl border border-gray-200 bg-white p-3 outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium">Email Address</label>
                          <input
                            type="email"
                            value={patientForm.email}
                            onChange={(e) => setPatientForm({ ...patientForm, email: e.target.value })}
                            placeholder="Enter email address"
                            className="w-full rounded-xl border border-gray-200 bg-white p-3 outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium">Patient Condition</label>
                          <input
                            type="text"
                            value={patientForm.condition}
                            onChange={(e) => setPatientForm({ ...patientForm, condition: e.target.value })}
                            placeholder="Enter patient condition"
                            required
                            className="w-full rounded-xl border border-gray-200 bg-white p-3 outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="mb-2 block text-sm font-medium">Select Doctor</label>
                          <select
                            value={patientForm.doctor}
                            onChange={(e) => setPatientForm({ ...patientForm, doctor: e.target.value })}
                            required
                            className="w-full rounded-xl border border-gray-200 bg-white p-3 outline-none focus:border-blue-500"
                          >
                            <option value="">Select a doctor</option>
                            {doctorList.map((doctor) => (
                              <option key={doctor._id} value={doctor._id}>
                                {doctor.name} - {doctor.specialization}
                              </option>
                            ))}
                          </select>
                        </div>

                      </div>

                      {patientError && (
                        <p className="mt-4 text-sm text-red-600">{patientError}</p>
                      )}

                      <div className="mt-6 flex gap-3">
                        <button
                          type="submit"
                          disabled={patientLoading}
                          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {patientLoading
                            ? "Saving..."
                            : editingPatientId
                            ? "Update Patient"
                            : "Add Patient"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowPatientForm(false);
                            setPatientError("");
                          }}
                          className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* PATIENT SEARCH AND CONDITION FILTER */}
                <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">

                    <input
                        type="text"
                        placeholder="Search patients..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPatientPage(1);
                        }}
                        className="w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-blue-500"
                    />

                    <select
                        value={patientCondition}
                        onChange={(e) => {
                            setPatientCondition(e.target.value);
                            setPatientPage(1);
                        }}
                        className="w-full rounded-xl border border-gray-200 bg-white p-3 outline-none focus:border-blue-500"
                    >
                        <option value="">All Conditions</option>
                        <option value="Diabetes">Diabetes</option>
                        <option value="High Blood Pressure">High Blood Pressure</option>
                        <option value="Heart Disease">Heart Disease</option>
                        <option value="Asthma">Asthma</option>
                        <option value="Fever">Fever</option>
                        <option value="Migraine">Migraine</option>
                    </select>

                    {/* START DATE FILTER */}
                    <input
                        type="date"
                        value={patientStartDate}
                        onChange={(e) => {
                            setPatientStartDate(e.target.value);
                            setPatientPage(1);
                        }}
                        className="w-full rounded-xl border border-gray-200 bg-white p-3 outline-none focus:border-blue-500"
                    />

                    {/* END DATE FILTER */}
                    <input
                        type="date"
                        value={patientEndDate}
                        onChange={(e) => {
                            setPatientEndDate(e.target.value);
                            setPatientPage(1);
                        }}
                        className="w-full rounded-xl border border-gray-200 bg-white p-3 outline-none focus:border-blue-500"
                    />

                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-4">Patient</th>
                        <th className="p-4">Patient ID</th>
                        <th className="p-4">Doctor</th>
                        <th className="p-4">Condition</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientList
                        .filter((p) =>
                          p.name?.toLowerCase().includes(search.toLowerCase()) ||
                          p._id?.toLowerCase().includes(search.toLowerCase()) ||
                          p.condition?.toLowerCase().includes(search.toLowerCase()) ||
                          p.doctor?.name?.toLowerCase().includes(search.toLowerCase())
                        )
                        .map((p) => (
                          <tr key={p._id} className="border-b">
                            <td className="p-4 font-semibold">{p.name}</td>

                            <td className="p-4 text-gray-500">
                              {p._id?.slice(-8)}
                            </td>

                            <td className="p-4">
                              {p.doctor?.name || "N/A"}
                            </td>

                            <td className="p-4">
                              {p.condition}
                            </td>

                            <td className="p-4 text-gray-500">
                              {p.createdAt
                                ? new Date(p.createdAt).toLocaleDateString()
                                : "N/A"}
                            </td>

                            <td className="p-4">
                              <button
                                type="button"
                                onClick={() => handleEditPatient(p)}
                                className="mr-2 rounded-lg bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-200"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePatient(p._id)}
                                className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-200"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}

                      {patientList.length === 0 && (
                        <tr>
                          <td colSpan="6" className="p-5 text-center text-gray-500">
                            No patients found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* PATIENT PAGINATION */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">

                    <p className="text-sm text-gray-500">
                        Page {patientPage} of {patientTotalPages}
                    </p>

                    <div className="flex gap-2">

                        <button
                            type="button"
                            onClick={() =>
                                setPatientPage((previous) => Math.max(1, previous - 1))
                            }
                            disabled={patientPage === 1}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold disabled:opacity-40"
                        >
                            Previous
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                setPatientPage((previous) =>
                                    Math.min(patientTotalPages, previous + 1)
                                )
                            }
                            disabled={patientPage >= patientTotalPages}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                        >
                            Next
                        </button>

                    </div>
                </div>
              </div>
            )}

          </div>

          <footer className="border-t border-gray-200 bg-white px-8 py-5 text-center text-xs text-gray-400">
            © 2026 DoctorTracker. All rights reserved.
          </footer>

        </main>
      </div>
    </div>
    )
  );
}
