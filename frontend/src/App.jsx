import { Routes, Route, Navigate } from "react-router-dom";

// AUTH
import CommonLogin from "./pages/CommonLogin";
import CommonRegister from "./pages/CommonRegister";

// DASHBOARDS
import AdminDashboard from "./pages/AdminDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import PatientDashboard from "./pages/PatientDashboard";

// PAGES
import Dashboard from "./pages/Dashboard";
import AdminPage from "./pages/AdminPage";
import PatientsPage from "./pages/PatientsPage";
import DoctorsPage from "./pages/DoctorsPage";
import StaffPage from "./pages/StaffPage";
import StaffRoleManagementPage from "./pages/StaffRoleManagementPage";
import AnalyticsPage from "./pages/AnalyticsPage";
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

// PROTECTED ROUTE
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* DEFAULT */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* AUTH */}
      <Route path="/login" element={<CommonLogin />} />
      <Route path="/register" element={<CommonRegister />} />

      {/* ROLE DASHBOARDS */}
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctor-dashboard"
        element={
          <ProtectedRoute allowedRole="doctor">
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff-dashboard"
        element={
          <ProtectedRoute allowedRole="staff">
            <StaffDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patient-dashboard"
        element={
          <ProtectedRoute allowedRole="patient">
            <PatientDashboard />
          </ProtectedRoute>
        }
      />

      {/* SYSTEM */}
      <Route
        path="/system"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* MANAGEMENT (admin) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/patients"
        element={
          <ProtectedRoute allowedRole="admin">
            <PatientsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/doctors"
        element={
          <ProtectedRoute allowedRole="admin">
            <DoctorsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff"
        element={
          <ProtectedRoute allowedRole="admin">
            <StaffPage />
          </ProtectedRoute>
        }
      />

      {/* NEW: admin assigns staff work roles */}
      <Route
        path="/staff-roles"
        element={
          <ProtectedRoute allowedRole="admin">
            <StaffRoleManagementPage />
          </ProtectedRoute>
        }
      />

      {/* NEW: admin analytics */}
      <Route
        path="/analytics"
        element={
          <ProtectedRoute allowedRole="admin">
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/departments"
        element={
          <ProtectedRoute allowedRole="admin">
            <DepartmentsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/wards"
        element={
          <ProtectedRoute allowedRole="admin">
            <WardsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rooms"
        element={
          <ProtectedRoute allowedRole="admin">
            <RoomsPage />
          </ProtectedRoute>
        }
      />

      {/* SHARED PAGES */}
      <Route
        path="/blood-bank"
        element={
          <ProtectedRoute>
            <BloodBankPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <AppointmentsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/time-slots"
        element={
          <ProtectedRoute>
            <TimeSlotsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/medical-items"
        element={
          <ProtectedRoute>
            <MedicalItemsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/prescriptions"
        element={
          <ProtectedRoute>
            <PrescriptionsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/lab-tests"
        element={
          <ProtectedRoute>
            <LabTestsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/surgeries"
        element={
          <ProtectedRoute>
            <SurgeriesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admissions"
        element={
          <ProtectedRoute>
            <AdmissionsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/insurance"
        element={
          <ProtectedRoute>
            <InsurancePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/billing"
        element={
          <ProtectedRoute>
            <BillingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payments"
        element={
          <ProtectedRoute>
            <PaymentsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/complaints"
        element={
          <ProtectedRoute>
            <ComplaintsPage />
          </ProtectedRoute>
        }
      />

      {/* OLD LOGIN REDIRECTS */}
      <Route path="/admin-login" element={<Navigate to="/login" />} />
      <Route path="/doctor-login" element={<Navigate to="/login" />} />
      <Route path="/staff-login" element={<Navigate to="/login" />} />
      <Route path="/patient-login" element={<Navigate to="/login" />} />

      {/* OLD REGISTER REDIRECTS */}
      <Route path="/admin-register" element={<Navigate to="/register" />} />
      <Route path="/doctor-registration" element={<Navigate to="/register" />} />
      <Route path="/staff-registration" element={<Navigate to="/register" />} />
      <Route path="/patient-registration" element={<Navigate to="/register" />} />

      {/* UNKNOWN */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
