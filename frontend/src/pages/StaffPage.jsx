import CrudPage from "../components/CrudPage";

export default function StaffPage() {
  return (
    <CrudPage
      title="Staff"
      description="Manage hospital staff"
      endpoint="/staff"
      idField="staff_id"
      lookups={{ departments: "/departments" }}
      columns={[
        { key: "staff_id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "dept_name", label: "Department" },
        { key: "phone", label: "Phone" },
        { key: "salary", label: "Salary", type: "money" },
      ]}
      fields={[
        { name: "name", label: "Full Name" },
        { name: "email", label: "Email", type: "email" },
        { name: "password", label: "Password", type: "password" },
        { name: "dept_id", label: "Department", type: "select", lookup: "departments", optionValue: "dept_id", optionLabel: "dept_name" },
        { name: "phone", label: "Phone" },
        { name: "salary", label: "Salary", type: "number" },
      ]}
    />
  );
}
