import CrudPage from "../components/CrudPage";

export default function DoctorsPage() {
  return (
    <CrudPage
      title="Doctors"
      description="Manage doctor records"
      endpoint="/doctors"
      idField="doctor_id"
      lookups={{ departments: "/departments" }}
      columns={[
        { key: "doctor_id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "specialization", label: "Specialization" },
        { key: "dept_name", label: "Department" },
        { key: "phone", label: "Phone" },
        { key: "status", label: "Status", type: "badge" },
      ]}
      fields={[
        { name: "name", label: "Full Name" },
        { name: "email", label: "Email", type: "email" },
        { name: "specialization", label: "Specialization" },
        { name: "dept_id", label: "Department", type: "select", lookup: "departments", optionValue: "dept_id", optionLabel: "dept_name" },
        { name: "phone", label: "Phone" },
        { name: "salary", label: "Salary", type: "number" },
        { name: "status", label: "Status", type: "select", options: ["active", "inactive"], default: "active" },
      ]}
    />
  );
}
