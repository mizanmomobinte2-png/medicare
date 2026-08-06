import CrudPage from "../components/CrudPage";

export default function WardsPage() {
  return (
    <CrudPage
      title="Wards"
      description="Manage hospital wards"
      endpoint="/wards"
      idField="ward_id"
      lookups={{ departments: "/departments" }}
      columns={[
        { key: "ward_id", label: "ID" },
        { key: "dept_name", label: "Department" },
        { key: "capacity", label: "Capacity" },
        { key: "floor", label: "Floor" },
      ]}
      fields={[
        { name: "dept_id", label: "Department", type: "select", lookup: "departments", optionValue: "dept_id", optionLabel: "dept_name" },
        { name: "capacity", label: "Capacity", type: "number" },
        { name: "floor", label: "Floor", type: "number" },
      ]}
    />
  );
}
