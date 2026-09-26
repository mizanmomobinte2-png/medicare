import CrudPage from "../components/CrudPage";

// Must match the keys in backend/config/workRoles.js
const WORK_ROLE_KEYS = [
  "FRONT_DESK",
  "ADMISSION",
  "LAB_TECH",
  "SURGERY_COORD",
  "BLOOD_BANK",
  "BILLING",
  "COMPLAINT",
  "AMBULANCE_COORD",
];

export default function StaffPage() {
  return (
    <CrudPage
      title="Staff"
      description="Manage hospital staff and their work roles"
      endpoint="/staff"
      idField="staff_id"
      lookups={{ departments: "/departments" }}
      columns={[
        { key: "staff_id", label: "ID" },
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "staff_role", label: "Work Role" },
        { key: "status", label: "Status", type: "badge" },
        { key: "dept_name", label: "Department" },
        { key: "phone", label: "Phone" },
        { key: "salary", label: "Salary", type: "money" },
      ]}
      fields={[
        { name: "name", label: "Full Name" },
        { name: "email", label: "Email", type: "email" },
        {
          name: "password",
          label: "Password (leave empty to keep the old one)",
          type: "password",
        },
        {
          name: "staff_role",
          label: "Work Role",
          type: "select",
          options: WORK_ROLE_KEYS,
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: ["active", "inactive"],
        },
        {
          name: "dept_id",
          label: "Department",
          type: "select",
          lookup: "departments",
          optionValue: "dept_id",
          optionLabel: "dept_name",
        },
        { name: "phone", label: "Phone" },
        { name: "salary", label: "Salary", type: "number" },
      ]}
    />
  );
}
