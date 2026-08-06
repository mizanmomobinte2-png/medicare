import CrudPage from "../components/CrudPage";

export default function BloodBankPage() {
  return (
    <CrudPage
      title="Blood Bank"
      description="Manage blood inventory"
      endpoint="/blood-bank"
      idField="bank_id"
      columns={[
        { key: "bank_id", label: "ID" },
        { key: "blood_group", label: "Blood Group" },
        { key: "available_quantity", label: "Quantity" },
        { key: "storage_location", label: "Location" },
        { key: "expiry_date", label: "Expiry", type: "date" },
      ]}
      fields={[
        { name: "blood_group", label: "Blood Group", type: "select", options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
        { name: "available_quantity", label: "Available Quantity", type: "number" },
        { name: "storage_location", label: "Storage Location" },
        { name: "expiry_date", label: "Expiry Date", type: "date" },
      ]}
    />
  );
}
