import CrudPage from "../components/CrudPage";

export default function PrescriptionsPage() {
  return (
    <CrudPage
      title="Prescriptions"
      description="Manage patient prescriptions"
      endpoint="/prescriptions"
      idField="pres_id"
      lookups={{ patients: "/patients", doctors: "/doctors" }}
      columns={[
        { key: "pres_id", label: "ID" },
        { key: "patient_name", label: "Patient" },
        { key: "doctor_name", label: "Doctor" },
        { key: "date", label: "Date", type: "date" },
        { key: "diagnosis", label: "Diagnosis" },
      ]}
      fields={[
        { name: "patient_id", label: "Patient", type: "select", lookup: "patients", optionValue: "patient_id", optionLabel: "name" },
        { name: "doctor_id", label: "Doctor", type: "select", lookup: "doctors", optionValue: "doctor_id", optionLabel: "name" },
        { name: "date", label: "Date", type: "date" },
        { name: "diagnosis", label: "Diagnosis", type: "textarea" },
        { name: "advice", label: "Advice", type: "textarea" },
        { name: "note", label: "Note", type: "textarea" },
      ]}
    />
  );
}
