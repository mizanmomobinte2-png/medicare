import CrudPage from "../components/CrudPage";

export default function InsurancePage() {
  return (
    <CrudPage
      title="Insurance"
      description="Manage patient insurance policies"
      endpoint="/insurance"
      idField="insurance_id"
      lookups={{ patients: "/patients" }}
      columns={[
        { key: "insurance_id", label: "ID" },
        { key: "patient_name", label: "Patient" },
        { key: "policy_number", label: "Policy No." },
        { key: "company_name", label: "Company" },
        { key: "coverage", label: "Coverage", type: "money" },
        { key: "expiry_date", label: "Expiry", type: "date" },
      ]}
      fields={[
        { name: "patient_id", label: "Patient", type: "select", lookup: "patients", optionValue: "patient_id", optionLabel: "name" },
        { name: "policy_number", label: "Policy Number" },
        { name: "company_name", label: "Company Name" },
        { name: "coverage", label: "Coverage Amount", type: "number" },
        { name: "expiry_date", label: "Expiry Date", type: "date" },
      ]}
    />
  );
}
