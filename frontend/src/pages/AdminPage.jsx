import CrudPage from "../components/CrudPage";

export default function AdminPage() {
  return (
    <CrudPage
      title="Admins"
      description="Manage admin users"
      endpoint="/admin"
      idField="user_id"
      columns={[
        { key: "user_id", label: "ID" },
        { key: "username", label: "Username" },
        { key: "role", label: "Role" },
        { key: "status", label: "Status", type: "badge" },
        { key: "last_login", label: "Last Login", type: "date" },
      ]}
      fields={[
        { name: "username", label: "Username" },
        { name: "password", label: "Password", type: "password" },
        { name: "role", label: "Role", type: "select", options: ["admin", "superadmin"], default: "admin" },
        { name: "status", label: "Status", type: "select", options: ["active", "inactive"], default: "active" },
      ]}
    />
  );
}
