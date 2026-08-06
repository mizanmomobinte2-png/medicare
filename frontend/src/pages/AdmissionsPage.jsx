import CrudPage from "../components/CrudPage";

export default function AdmissionsPage() {
  return (
    <CrudPage
      title="Admissions"
      description="Manage patient admissions"
      endpoint="/admissions"
      idField="adm_id"
      lookups={{ patients: "/patients", rooms: "/rooms" }}
      columns={[
        { key: "adm_id", label: "ID" },
        { key: "patient_name", label: "Patient" },
        { key: "room_type", label: "Room" },
        { key: "adm_date", label: "Admitted", type: "date" },
        { key: "discharge_date", label: "Discharged", type: "date" },
        { key: "status", label: "Status", type: "badge" },
        { key: "charge", label: "Charge", type: "money" },
      ]}
      fields={[
        { name: "patient_id", label: "Patient", type: "select", lookup: "patients", optionValue: "patient_id", optionLabel: "name" },
        { name: "room_id", label: "Room", type: "select", lookup: "rooms", optionValue: "room_id", optionLabel: "room_type" },
        { name: "adm_date", label: "Admission Date", type: "date" },
        { name: "discharge_date", label: "Discharge Date", type: "date" },
        { name: "status", label: "Status", type: "select", options: ["admitted", "discharged"], default: "admitted" },
        { name: "charge", label: "Charge", type: "number" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}
