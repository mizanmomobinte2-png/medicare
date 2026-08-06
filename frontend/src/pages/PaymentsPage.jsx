import CrudPage from "../components/CrudPage";

export default function PaymentsPage() {
  return (
    <CrudPage
      title="Payments"
      description="Manage bill payments"
      endpoint="/payments"
      idField="payment_id"
      lookups={{ bills: "/billing" }}
      columns={[
        { key: "payment_id", label: "ID" },
        { key: "patient_name", label: "Patient" },
        { key: "payment_date", label: "Date", type: "date" },
        { key: "amount", label: "Amount", type: "money" },
        { key: "method", label: "Method" },
        { key: "ref_no", label: "Ref No." },
        { key: "bill_status", label: "Bill Status", type: "badge" },
      ]}
      fields={[
        { name: "bill_id", label: "Bill", type: "select", lookup: "bills", optionValue: "bill_id", optionLabel: "bill_id" },
        { name: "payment_date", label: "Payment Date", type: "date" },
        { name: "amount", label: "Amount", type: "number" },
        { name: "method", label: "Method", type: "select", options: ["Cash", "Card", "Bank Transfer", "Insurance", "Mobile Banking"] },
        { name: "ref_no", label: "Reference No." },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
    />
  );
}
