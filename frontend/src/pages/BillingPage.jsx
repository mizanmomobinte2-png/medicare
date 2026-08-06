import CrudPage from "../components/CrudPage";

export default function BillingPage() {
  return (
    <CrudPage
      title="Billing"
      description="Manage patient bills"
      endpoint="/billing"
      idField="bill_id"
      lookups={{ admissions: "/admissions" }}
      columns={[
        { key: "bill_id", label: "ID" },
        { key: "patient_name", label: "Patient" },
        { key: "bill_date", label: "Date", type: "date" },
        { key: "amount", label: "Amount", type: "money" },
        { key: "discount", label: "Discount", type: "money" },
        { key: "tax", label: "Tax", type: "money" },
        { key: "status", label: "Status", type: "badge" },
      ]}
      fields={[
        { name: "adm_id", label: "Admission", type: "select", lookup: "admissions", optionValue: "adm_id", optionLabel: "patient_name" },
        { name: "bill_date", label: "Bill Date", type: "date" },
        { name: "amount", label: "Amount", type: "number" },
        { name: "discount", label: "Discount", type: "number", default: "0" },
        { name: "tax", label: "Tax", type: "number", default: "0" },
        { name: "status", label: "Status", type: "select", options: ["unpaid", "partial", "paid"], default: "unpaid" },
      ]}
    />
  );
}
