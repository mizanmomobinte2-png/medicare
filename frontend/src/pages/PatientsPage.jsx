import CrudPage from "../components/CrudPage";

export default function PatientsPage() {
  return (
    <CrudPage
      title="Patients"
      description="Manage patient records"
      endpoint="/patients"
      idField="patient_id"
      columns={[
        { key: "patient_id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "gender", label: "Gender" },
        { key: "blood_group", label: "Blood Group" },
      ]}
      fields={[
        { name: "name", label: "Full Name" },
        { name: "email", label: "Email", type: "email" },
        { name: "password", label: "Password", type: "password" },
        { name: "phone", label: "Phone" },
        { name: "dob", label: "Date of Birth", type: "date" },
        { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other"] },
        { name: "blood_group", label: "Blood Group", type: "select", options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
        { name: "address", label: "Address", type: "textarea" },
      ]}
    />
  );
}
