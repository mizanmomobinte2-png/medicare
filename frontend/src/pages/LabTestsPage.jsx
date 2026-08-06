import CrudPage from "../components/CrudPage";

export default function LabTestsPage() {
  return (
    <CrudPage
      title="Lab Tests"
      description="Manage laboratory tests"
      endpoint="/lab-tests"
      idField="test_id"
      lookups={{ patients: "/patients" }}
      columns={[
        { key: "test_id", label: "ID" },
        { key: "patient_name", label: "Patient" },
        { key: "test_name", label: "Test Name" },
        { key: "type", label: "Type" },
        { key: "unit_price", label: "Price", type: "money" },
        { key: "result", label: "Result" },
        { key: "date", label: "Date", type: "date" },
      ]}
      fields={[
        { name: "patient_id", label: "Patient", type: "select", lookup: "patients", optionValue: "patient_id", optionLabel: "name" },
        { name: "test_name", label: "Test Name" },
        { name: "type", label: "Type", type: "select", options: ["Cardiac", "Neurology", "Radiology", "Pathology", "Other"] },
        { name: "unit_price", label: "Unit Price", type: "number" },
        { name: "result", label: "Result", type: "textarea" },
        { name: "date", label: "Date", type: "date" },
      ]}
    />
  );
}
