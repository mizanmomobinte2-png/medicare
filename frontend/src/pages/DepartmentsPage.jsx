import CrudPage from "../components/CrudPage";

export default function DepartmentsPage() {
  return (
    <CrudPage
      title="Departments"
      description="Manage hospital departments"
      endpoint="/departments"
      idField="dept_id"
      columns={[
        { key: "dept_id", label: "ID" },
        { key: "dept_name", label: "Name" },
        { key: "floor", label: "Floor" },
        { key: "phone", label: "Phone" },
        { key: "email", label: "Email" },
      ]}
      fields={[
        { name: "dept_name", label: "Department Name" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "floor", label: "Floor", type: "number" },
        { name: "phone", label: "Phone" },
        { name: "email", label: "Email", type: "email" },
      ]}
    />
  );
}
