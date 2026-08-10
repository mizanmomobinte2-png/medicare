import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// =========================================
// COMMON LOGIN / REGISTER
// =========================================

import CommonLogin from "./pages/CommonLogin";
import CommonRegister from "./pages/CommonRegister";

// =========================================
// ROLE DASHBOARDS
// =========================================

import AdminDashboard from "./pages/AdminDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import PatientDashboard from "./pages/PatientDashboard";

// =========================================
// GENERAL MANAGEMENT PAGES
// =========================================

import Dashboard from "./pages/Dashboard";
import AdminPage from "./pages/AdminPage";
import PatientsPage from "./pages/PatientsPage";
import DoctorsPage from "./pages/DoctorsPage";
import StaffPage from "./pages/StaffPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import WardsPage from "./pages/WardsPage";
import RoomsPage from "./pages/RoomsPage";
import BloodBankPage from "./pages/BloodBankPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import TimeSlotsPage from "./pages/TimeSlotsPage";
import MedicalItemsPage from "./pages/MedicalItemsPage";
import PrescriptionsPage from "./pages/PrescriptionsPage";
import LabTestsPage from "./pages/LabTestsPage";
import SurgeriesPage from "./pages/SurgeriesPage";
import AdmissionsPage from "./pages/AdmissionsPage";
import InsurancePage from "./pages/InsurancePage";
import BillingPage from "./pages/BillingPage";
import PaymentsPage from "./pages/PaymentsPage";
import ComplaintsPage from "./pages/ComplaintsPage";

function App() {
  return (
    <Routes>

      {/* =====================================
          DEFAULT
      ====================================== */}

      <Route
        path="/"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      {/* =====================================
          COMMON AUTH
      ====================================== */}

      <Route
        path="/login"
        element={
          <CommonLogin />
        }
      />

      <Route
        path="/register"
        element={
          <CommonRegister />
        }
      />

      {/* =====================================
          ROLE DASHBOARDS
      ====================================== */}

      <Route
        path="/admin-dashboard"
        element={
          <AdminDashboard />
        }
      />

      <Route
        path="/doctor-dashboard"
        element={
          <DoctorDashboard />
        }
      />

      <Route
        path="/staff-dashboard"
        element={
          <StaffDashboard />
        }
      />

      <Route
        path="/patient-dashboard"
        element={
          <PatientDashboard />
        }
      />

      {/* =====================================
          GENERAL SYSTEM DASHBOARD
      ====================================== */}

      <Route
        path="/system"
        element={
          <Dashboard />
        }
      />

      {/* =====================================
          ADMIN MANAGEMENT
      ====================================== */}

      <Route
        path="/admin"
        element={
          <AdminPage />
        }
      />

      {/* =====================================
          PATIENTS
      ====================================== */}

      <Route
        path="/patients"
        element={
          <PatientsPage />
        }
      />

      {/* =====================================
          DOCTORS
      ====================================== */}

      <Route
        path="/doctors"
        element={
          <DoctorsPage />
        }
      />

      {/* =====================================
          STAFF
      ====================================== */}

      <Route
        path="/staff"
        element={
          <StaffPage />
        }
      />

      {/* =====================================
          DEPARTMENTS
      ====================================== */}

      <Route
        path="/departments"
        element={
          <DepartmentsPage />
        }
      />

      {/* =====================================
          WARDS
      ====================================== */}

      <Route
        path="/wards"
        element={
          <WardsPage />
        }
      />

      {/* =====================================
          ROOMS
      ====================================== */}

      <Route
        path="/rooms"
        element={
          <RoomsPage />
        }
      />

      {/* =====================================
          BLOOD BANK
      ====================================== */}

      <Route
        path="/blood-bank"
        element={
          <BloodBankPage />
        }
      />

      {/* =====================================
          APPOINTMENTS
      ====================================== */}

      <Route
        path="/appointments"
        element={
          <AppointmentsPage />
        }
      />

      {/* =====================================
          TIME SLOTS
      ====================================== */}

      <Route
        path="/time-slots"
        element={
          <TimeSlotsPage />
        }
      />

      {/* =====================================
          MEDICAL ITEMS
      ====================================== */}

      <Route
        path="/medical-items"
        element={
          <MedicalItemsPage />
        }
      />

      {/* =====================================
          PRESCRIPTIONS
      ====================================== */}

      <Route
        path="/prescriptions"
        element={
          <PrescriptionsPage />
        }
      />

      {/* =====================================
          LAB TESTS
      ====================================== */}

      <Route
        path="/lab-tests"
        element={
          <LabTestsPage />
        }
      />

      {/* =====================================
          SURGERIES
      ====================================== */}

      <Route
        path="/surgeries"
        element={
          <SurgeriesPage />
        }
      />

      {/* =====================================
          ADMISSIONS
      ====================================== */}

      <Route
        path="/admissions"
        element={
          <AdmissionsPage />
        }
      />

      {/* =====================================
          INSURANCE
      ====================================== */}

      <Route
        path="/insurance"
        element={
          <InsurancePage />
        }
      />

      {/* =====================================
          BILLING
      ====================================== */}

      <Route
        path="/billing"
        element={
          <BillingPage />
        }
      />

      {/* =====================================
          PAYMENTS
      ====================================== */}

      <Route
        path="/payments"
        element={
          <PaymentsPage />
        }
      />

      {/* =====================================
          COMPLAINTS
      ====================================== */}

      <Route
        path="/complaints"
        element={
          <ComplaintsPage />
        }
      />

      {/* =====================================
          OLD LOGIN URL REDIRECTS
      ====================================== */}

      <Route
        path="/admin-login"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      <Route
        path="/doctor-login"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      <Route
        path="/staff-login"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      <Route
        path="/patient-login"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

      {/* =====================================
          OLD REGISTER URL REDIRECTS
      ====================================== */}

      <Route
        path="/admin-register"
        element={
          <Navigate
            to="/register"
            replace
          />
        }
      />

      <Route
        path="/doctor-registration"
        element={
          <Navigate
            to="/register"
            replace
          />
        }
      />

      <Route
        path="/staff-registration"
        element={
          <Navigate
            to="/register"
            replace
          />
        }
      />

      <Route
        path="/patient-registration"
        element={
          <Navigate
            to="/register"
            replace
          />
        }
      />

      {/* =====================================
          UNKNOWN URL
      ====================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/login"
            replace
          />
        }
      />

    </Routes>
  );
}

export default App;