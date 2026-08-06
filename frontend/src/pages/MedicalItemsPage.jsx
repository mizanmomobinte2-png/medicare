import CrudPage from "../components/CrudPage";

export default function MedicalItemsPage() {
  return (
    <CrudPage
      title="Medical Items"
      description="Manage medicines and medical supplies"
      endpoint="/medical-items"
      idField="item_id"
      columns={[
        { key: "item_id", label: "ID" },
        { key: "item_name", label: "Name" },
        { key: "category", label: "Category" },
        { key: "unit_price", label: "Price", type: "money" },
        { key: "manufacturer", label: "Manufacturer" },
      ]}
      fields={[
        { name: "item_name", label: "Item Name" },
        { name: "category", label: "Category", type: "select", options: ["Painkiller", "Antibiotic", "Diabetes", "Blood Thinner", "Vitamin", "Other"] },
        { name: "unit_price", label: "Unit Price", type: "number" },
        { name: "manufacturer", label: "Manufacturer" },
      ]}
    />
  );
}
