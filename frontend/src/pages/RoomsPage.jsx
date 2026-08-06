import CrudPage from "../components/CrudPage";

export default function RoomsPage() {
  return (
    <CrudPage
      title="Rooms"
      description="Manage hospital rooms"
      endpoint="/rooms"
      idField="room_id"
      lookups={{ wards: "/wards" }}
      columns={[
        { key: "room_id", label: "ID" },
        { key: "room_type", label: "Type" },
        { key: "dept_name", label: "Department" },
        { key: "floor", label: "Floor" },
        { key: "capacity", label: "Capacity" },
        { key: "status", label: "Status", type: "badge" },
      ]}
      fields={[
        { name: "ward_id", label: "Ward", type: "select", lookup: "wards", optionValue: "ward_id", optionLabel: "ward_id" },
        { name: "room_type", label: "Room Type", type: "select", options: ["General", "Private", "ICU", "Emergency"] },
        { name: "floor", label: "Floor", type: "number" },
        { name: "capacity", label: "Capacity", type: "number" },
        { name: "status", label: "Status", type: "select", options: ["available", "occupied", "maintenance"], default: "available" },
      ]}
    />
  );
}
