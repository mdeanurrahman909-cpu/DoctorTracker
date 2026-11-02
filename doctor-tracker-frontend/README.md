# DoctorTracker — Doctor & Patient Management System

DoctorTracker is a secure and responsive web application designed to manage doctors and patients efficiently. It provides an admin dashboard with doctor management, patient management, search, filtering, pagination, and healthcare statistics.

## Features

### Authentication

* Admin login.
* JWT-based authentication.
* Protected API routes.

### Doctor Management

* Add new doctors.
* View doctor details.
* Edit doctor information.
* Delete doctors.
* Search doctors.
* Date-based filtering.
* Pagination.
* View patients associated with each doctor.

### Patient Management

* Add patients under doctors.
* View all patients.
* Edit patient information.
* Delete patients.
* Search patients.
* Filter patients by condition and date.
* Pagination.

### Dashboard

* Total doctors.
* Total patients.
* Patients per doctor.
* Date-wise patient statistics.
* Charts and graphs.

## Technology Stack

**Frontend**

* Next.js
* React.js
* JavaScript
* Tailwind CSS

**Backend**

* Node.js
* Express.js
* REST API
* JWT Authentication

**Database**

* MongoDB Atlas
* Mongoose

## Project Structure

```text
DoctorTracker/
│
├── doctor-tracker-frontend/
│   ├── app/
│   │   ├── page.js
│   │   └── ...
│   ├── public/
│   ├── package.json
│   └── README.md
│
└── doctor-tracker-backend/
    ├── models/
    ├── controllers/
    ├── routes/
    ├── middleware/
    ├── server.js
    └── package.json
```

## Installation and Setup

### Requirements

* Node.js
* npm
* MongoDB Atlas

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Backend Setup

```bash
cd doctor-tracker-backend
npm install
```

Create a `.env` file in the backend folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_jwt_secret
```

Start the backend:

```bash
node server.js
```

Backend URL:

`http://localhost:5000`

### 3. Frontend Setup

Open another terminal:

```bash
cd doctor-tracker-frontend
npm install
npm run dev
```

Frontend URL:

`http://localhost:3000`

## API Endpoints

| Method | Endpoint             | Description          |
| ------ | -------------------- | -------------------- |
| POST   | /api/auth/login      | Admin Login          |
| GET    | /api/doctors         | Get Doctors          |
| POST   | /api/doctors         | Add Doctor           |
| GET    | /api/doctors/:id     | Get Doctor Details   |
| PUT    | /api/doctors/:id     | Update Doctor        |
| DELETE | /api/doctors/:id     | Delete Doctor        |
| GET    | /api/patients        | Get Patients         |
| POST   | /api/patients        | Add Patient          |
| PUT    | /api/patients/:id    | Update Patient       |
| DELETE | /api/patients/:id    | Delete Patient       |
| GET    | /api/dashboard/stats | Dashboard Statistics |

Protected API endpoints require JWT authentication.

## Database Design

### Doctor

* Name
* Specialization
* Hospital
* Phone
* Email
* Created At
* Updated At

### Patient

* Name
* Age
* Gender
* Phone
* Email
* Condition
* Doctor Reference
* Created At
* Updated At

Patients are connected to doctors using MongoDB ObjectId references.

## Technical Decisions

### 1. JWT Authentication

JWT authentication protects administrative API routes and prevents unauthorized access.

### 2. MongoDB Aggregation

MongoDB aggregation is used to calculate dashboard statistics, including patients per doctor and date-wise patient statistics.

### 3. Database Indexing

MongoDB indexes help improve search and query performance.

### 4. Server-side Pagination

Pagination and filtering are handled through backend API queries to reduce unnecessary data transfer.

## Security

* Environment variables are used for sensitive credentials.
* JWT protects private API routes.
* MongoDB credentials should never be published.
* `.env` files should not be committed to GitHub.

## Screenshots

Screenshots will be added after completing the application UI and responsive design.

* Dashboard
* Doctors Management
* Patients Management
* Mobile Responsive View

## Future Improvements

* Excel and PDF report exports.
* Advanced analytics.
* Role-based access control.
* Appointment management.

## Author

Developed as a Doctor and Patient Management System assignment.

**DoctorTracker — Simplifying Doctor and Patient Management.**
