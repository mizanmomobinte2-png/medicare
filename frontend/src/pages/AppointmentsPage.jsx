import CrudPage from "../components/CrudPage";

export default function AppointmentsPage() {
  return (
    <CrudPage
      title="Appointments"
      description="Manage patient appointments"
      endpoint="/appointments"
      idField="appt_id"
      lookups={{ patients: "/patients", doctors: "/doctors", staff: "/staff" }}
      columns={[
        { key: "appt_id", label: "ID" },
        { key: "patient_name", label: "Patient" },
        { key: "doctor_name", label: "Doctor" },
        { key: "appt_date", label: "Date", type: "date" },
        { key: "appt_time", label: "Time" },
        { key: "status", label: "Status", type: "badge" },
        { key: "reason", label: "Reason" },
      ]}
      fields={[
        { name: "patient_id", label: "Patient", type: "select", lookup: "patients", optionValue: "patient_id", optionLabel: "name" },
        { name: "doctor_id", label: "Doctor", type: "select", lookup: "doctors", optionValue: "doctor_id", optionLabel: "name" },
        { name: "staff_id", label: "Approved By (Staff)", type: "select", lookup: "staff", optionValue: "staff_id", optionLabel: "name" },
        { name: "appt_date", label: "Date", type: "date" },
        { name: "appt_time", label: "Time", type: "time" },
        { name: "status", label: "Status", type: "select", options: ["pending", "approved", "cancelled", "completed"], default: "pending" },
        { name: "reason", label: "Reason", type: "textarea" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}
