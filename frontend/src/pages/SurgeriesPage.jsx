import CrudPage from "../components/CrudPage";

export default function SurgeriesPage() {
  return (
    <CrudPage
      title="Surgeries"
      description="Manage surgical procedures"
      endpoint="/surgeries"
      idField="surgery_id"
      lookups={{ patients: "/patients", doctors: "/doctors" }}
      columns={[
        { key: "surgery_id", label: "ID" },
        { key: "patient_name", label: "Patient" },
        { key: "doctor_name", label: "Doctor" },
        { key: "surgery_name", label: "Surgery" },
        { key: "type", label: "Type" },
        { key: "date", label: "Date", type: "date" },
      ]}
      fields={[
        { name: "patient_id", label: "Patient", type: "select", lookup: "patients", optionValue: "patient_id", optionLabel: "name" },
        { name: "doctor_id", label: "Doctor", type: "select", lookup: "doctors", optionValue: "doctor_id", optionLabel: "name" },
        { name: "surgery_name", label: "Surgery Name" },
        { name: "type", label: "Type", type: "select", options: ["Cardiac", "Orthopedic", "Neurology", "General", "Other"] },
        { name: "date", label: "Date", type: "date" },
      ]}
    />
  );
}
