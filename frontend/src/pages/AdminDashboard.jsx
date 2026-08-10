import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/AdminDashboard.css";

// Existing management pages
import AdminPage from "./AdminPage";
import DoctorsPage from "./DoctorsPage";
import StaffPage from "./StaffPage";
import PatientsPage from "./PatientsPage";
import DepartmentsPage from "./DepartmentsPage";
import AppointmentsPage from "./AppointmentsPage";
import AdmissionsPage from "./AdmissionsPage";
import WardsPage from "./WardsPage";
import RoomsPage from "./RoomsPage";
import BloodBankPage from "./BloodBankPage";
import LabTestsPage from "./LabTestsPage";
import SurgeriesPage from "./SurgeriesPage";
import BillingPage from "./BillingPage";
import PaymentsPage from "./PaymentsPage";
import ComplaintsPage from "./ComplaintsPage";

const API = "http://localhost:5000/api";

function AdminDashboard() {
  const navigate = useNavigate();

  // =========================================
  // LOGGED IN ADMIN
  // =========================================

  let storedAdmin = null;

  try {
    storedAdmin = JSON.parse(
      localStorage.getItem("admin") || "null"
    );
  } catch {
    storedAdmin = null;
  }

  const adminId = Number(
    storedAdmin?.admin_id ||
      storedAdmin?.user_id ||
      0
  );

  // =========================================
  // STATE
  // =========================================

  const [activePage, setActivePage] =
    useState("dashboard");

  const [stats, setStats] = useState({
    patients: 0,
    doctors: 0,
    staff: 0,
    appointments: 0,
    admissions: 0,
    bills: 0,
  });

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState("");

  // =========================================
  // LOAD DASHBOARD
  // =========================================

  const loadDashboard = async () => {
    if (!adminId) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API}/dashboard`
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Could not load dashboard information."
        );

        return;
      }

      setStats({
        patients: Number(
          data.patients || 0
        ),

        doctors: Number(
          data.doctors || 0
        ),

        staff: Number(
          data.staff || 0
        ),

        appointments: Number(
          data.appointments || 0
        ),

        admissions: Number(
          data.admissions || 0
        ),

        bills: Number(
          data.bills || 0
        ),
      });
    } catch (error) {
      console.error(
        "Admin dashboard error:",
        error
      );

      setMessage(
        "Server connection failed."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [adminId]);

  // =========================================
  // LOGOUT
  // =========================================

  const logout = () => {
    localStorage.removeItem("admin");
    localStorage.removeItem("role");

    navigate("/login");
  };

  // =========================================
  // SIDEBAR BUTTON
  // =========================================

  const MenuButton = ({
    page,
    children,
  }) => {
    return (
      <button
        className={
          activePage === page
            ? "admin-menu-active"
            : ""
        }
        onClick={() =>
          setActivePage(page)
        }
      >
        {children}
      </button>
    );
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        Loading admin dashboard...
      </div>
    );
  }

  // =========================================
  // UI
  // =========================================

  return (
    <div className="admin-dashboard">

      {/* =====================================
          SIDEBAR
      ====================================== */}

      <aside className="admin-dashboard-sidebar">

        <h2>MediCare</h2>

        <p className="admin-name">
          {storedAdmin?.username ||
            `Admin ${adminId}`}
        </p>

        <MenuButton page="dashboard">
          Dashboard
        </MenuButton>

        <MenuButton page="admins">
          Admins
        </MenuButton>

        <MenuButton page="doctors">
          Doctors
        </MenuButton>

        <MenuButton page="staff">
          Staff
        </MenuButton>

        <MenuButton page="patients">
          Patients
        </MenuButton>

        <MenuButton page="departments">
          Departments
        </MenuButton>

        <MenuButton page="appointments">
          Appointments
        </MenuButton>

        <MenuButton page="admissions">
          Admissions
        </MenuButton>

        <MenuButton page="wards">
          Wards
        </MenuButton>

        <MenuButton page="rooms">
          Rooms
        </MenuButton>

        <MenuButton page="blood">
          Blood Bank
        </MenuButton>

        <MenuButton page="labtests">
          Lab Tests
        </MenuButton>

        <MenuButton page="surgeries">
          Surgeries
        </MenuButton>

        <MenuButton page="billing">
          Billing
        </MenuButton>

        <MenuButton page="payments">
          Payments
        </MenuButton>

        <MenuButton page="complaints">
          Complaints
        </MenuButton>

        <button
          className="admin-dashboard-logout"
          onClick={logout}
        >
          Logout
        </button>

      </aside>

      {/* =====================================
          MAIN
      ====================================== */}

      <main className="admin-dashboard-main">

        {message && (
          <div className="admin-dashboard-message">
            {message}
          </div>
        )}

        {/* =====================================
            DASHBOARD
        ====================================== */}

        {activePage === "dashboard" && (
          <>
            <div className="admin-dashboard-header">

              <h1>
                Admin Dashboard
              </h1>

              <p>
                Welcome,{" "}
                <strong>
                  {storedAdmin?.username ||
                    "Admin"}
                </strong>
              </p>

            </div>

            <div className="admin-stats">

              <div className="admin-stat-box">
                <h3>
                  Doctors
                </h3>

                <p>
                  {stats.doctors}
                </p>

                <button
                  onClick={() =>
                    setActivePage(
                      "doctors"
                    )
                  }
                >
                  Manage
                </button>
              </div>

              <div className="admin-stat-box">
                <h3>
                  Staff
                </h3>

                <p>
                  {stats.staff}
                </p>

                <button
                  onClick={() =>
                    setActivePage(
                      "staff"
                    )
                  }
                >
                  Manage
                </button>
              </div>

              <div className="admin-stat-box">
                <h3>
                  Patients
                </h3>

                <p>
                  {stats.patients}
                </p>

                <button
                  onClick={() =>
                    setActivePage(
                      "patients"
                    )
                  }
                >
                  Manage
                </button>
              </div>

              <div className="admin-stat-box">
                <h3>
                  Appointments
                </h3>

                <p>
                  {
                    stats.appointments
                  }
                </p>

                <button
                  onClick={() =>
                    setActivePage(
                      "appointments"
                    )
                  }
                >
                  Manage
                </button>
              </div>

              <div className="admin-stat-box">
                <h3>
                  Admissions
                </h3>

                <p>
                  {
                    stats.admissions
                  }
                </p>

                <button
                  onClick={() =>
                    setActivePage(
                      "admissions"
                    )
                  }
                >
                  Manage
                </button>
              </div>

              <div className="admin-stat-box">
                <h3>
                  Bills
                </h3>

                <p>
                  {stats.bills}
                </p>

                <button
                  onClick={() =>
                    setActivePage(
                      "billing"
                    )
                  }
                >
                  Manage
                </button>
              </div>

            </div>

            <section className="admin-dashboard-panel">

              <h2>
                Administration
              </h2>

              <p>
                From this dashboard you can
                manage administrators,
                doctors, staff, patients,
                departments, appointments,
                admissions, hospital rooms,
                laboratory tests, surgeries,
                bills, payments and complaints.
              </p>

            </section>
          </>
        )}

        {/* =====================================
            ADMINS
        ====================================== */}

        {activePage === "admins" && (
          <section className="admin-module">

            <div className="module-heading">
              <h1>
                Admin Management
              </h1>

              <p>
                Add, edit and delete admin
                users.
              </p>
            </div>

            <AdminPage />

          </section>
        )}

        {/* =====================================
            DOCTORS
        ====================================== */}

        {activePage === "doctors" && (
          <section className="admin-module">

            <div className="module-heading">
              <h1>
                Doctor Management
              </h1>

              <p>
                View, add, edit and delete
                doctors.
              </p>
            </div>

            <DoctorsPage />

          </section>
        )}

        {/* =====================================
            STAFF
        ====================================== */}

        {activePage === "staff" && (
          <section className="admin-module">

            <div className="module-heading">
              <h1>
                Staff Management
              </h1>

              <p>
                View, add, edit and delete
                hospital staff.
              </p>
            </div>

            <StaffPage />

          </section>
        )}

        {/* =====================================
            PATIENTS
        ====================================== */}

        {activePage === "patients" && (
          <section className="admin-module">

            <div className="module-heading">
              <h1>
                Patient Management
              </h1>

              <p>
                View, add, edit and delete
                patients.
              </p>
            </div>

            <PatientsPage />

          </section>
        )}

        {/* =====================================
            DEPARTMENTS
        ====================================== */}

        {activePage === "departments" && (
          <section className="admin-module">

            <div className="module-heading">
              <h1>
                Department Management
              </h1>

              <p>
                Add, update and delete hospital
                departments.
              </p>
            </div>

            <DepartmentsPage />

          </section>
        )}

        {/* =====================================
            APPOINTMENTS
        ====================================== */}

        {activePage === "appointments" && (
          <section className="admin-module">

            <div className="module-heading">
              <h1>
                Appointment Management
              </h1>
            </div>

            <AppointmentsPage />

          </section>
        )}

        {/* =====================================
            ADMISSIONS
        ====================================== */}

        {activePage === "admissions" && (
          <section className="admin-module">

            <div className="module-heading">
              <h1>
                Admission Management
              </h1>
            </div>

            <AdmissionsPage />

          </section>
        )}

        {/* =====================================
            WARDS
        ====================================== */}

        {activePage === "wards" && (
          <section className="admin-module">

            <div className="module-heading">
              <h1>
                Ward Management
              </h1>
            </div>

            <WardsPage />

          </section>
        )}

        {/* =====================================
            ROOMS
        ====================================== */}

        {activePage === "rooms" && (
          <section className="admin-module">

            <div className="module-heading">
              <h1>
                Room Management
              </h1>
            </div>

            <RoomsPage />

          </section>
        )}

        {/* =====================================
            BLOOD BANK
        ====================================== */}

        {activePage === "blood" && (
          <section className="admin-module">

            <div className="module-heading">
              <h1>
                Blood Bank Management
              </h1>
            </div>

            <BloodBankPage />

          </section>
        )}

        {/* =====================================
            LAB TESTS
        ====================================== */}

        {activePage === "labtests" && (
          <section className="admin-module">

            <div className="module-heading">
              <h1>
                Lab Test Management
              </h1>
            </div>

            <LabTestsPage />

          </section>
        )}

        {/* =====================================
            SURGERIES
        ====================================== */}

        {activePage === "surgeries" && (
          <section className="admin-module">

            <div className="module-heading">
              <h1>
                Surgery Management
              </h1>
            </div>

            <SurgeriesPage />

          </section>
        )}

        {/* =====================================
            BILLING
        ====================================== */}

        {activePage === "billing" && (
          <section className="admin-module">

            <div className="module-heading">
              <h1>
                Billing Management
              </h1>
            </div>

            <BillingPage />

          </section>
        )}

        {/* =====================================
            PAYMENTS
        ====================================== */}

        {activePage === "payments" && (
          <section className="admin-module">

            <div className="module-heading">
              <h1>
                Payment Management
              </h1>
            </div>

            <PaymentsPage />

          </section>
        )}

        {/* =====================================
            COMPLAINTS
        ====================================== */}

        {activePage === "complaints" && (
          <section className="admin-module">

            <div className="module-heading">
              <h1>
                Complaint Management
              </h1>

              <p>
                View and manage complaints.
              </p>
            </div>

            <ComplaintsPage />

          </section>
        )}

      </main>

    </div>
  );
}

export default AdminDashboard;