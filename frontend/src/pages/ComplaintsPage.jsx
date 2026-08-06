import CrudPage from "../components/CrudPage";

export default function ComplaintsPage() {
  return (
    <CrudPage
      title="Complaints"
      description="Manage patient complaints"
      endpoint="/complaints"
      idField="complaint_id"
      lookups={{ patients: "/patients", staff: "/staff" }}
      columns={[
        { key: "complaint_id", label: "ID" },
        { key: "patient_name", label: "Patient" },
        { key: "staff_name", label: "Handled By" },
        { key: "complaint_type", label: "Type" },
        { key: "date", label: "Date", type: "date" },
        { key: "status", label: "Status", type: "badge" },
      ]}
      fields={[
        { name: "patient_id", label: "Patient", type: "select", lookup: "patients", optionValue: "patient_id", optionLabel: "name" },
        { name: "staff_id", label: "Handled By (Staff)", type: "select", lookup: "staff", optionValue: "staff_id", optionLabel: "name" },
        { name: "complaint_type", label: "Complaint Type" },
        { name: "date", label: "Date", type: "date" },
        { name: "status", label: "Status", type: "select", options: ["open", "in_progress", "resolved"], default: "open" },
        { name: "description", label: "Description", type: "textarea" },
      ]}
    />
  );
}
