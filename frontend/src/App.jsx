import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import PatientsPage from "./pages/PatientsPage";
import DoctorsPage from "./pages/DoctorsPage";
import StaffPage from "./pages/StaffPage";
import AdminPage from "./pages/AdminPage";
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="staff" element={<StaffPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="departments" element={<DepartmentsPage />} />
        <Route path="wards" element={<WardsPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="blood-bank" element={<BloodBankPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="time-slots" element={<TimeSlotsPage />} />
        <Route path="medical-items" element={<MedicalItemsPage />} />
        <Route path="prescriptions" element={<PrescriptionsPage />} />
        <Route path="lab-tests" element={<LabTestsPage />} />
        <Route path="surgeries" element={<SurgeriesPage />} />
        <Route path="admissions" element={<AdmissionsPage />} />
        <Route path="insurance" element={<InsurancePage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="complaints" element={<ComplaintsPage />} />
      </Route>
    </Routes>
  );
}
