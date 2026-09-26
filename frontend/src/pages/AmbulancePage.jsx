import CrudPage from "../components/CrudPage";

export default function AmbulancePage() {
  return (
    <CrudPage
      title="Ambulances"
      description="Manage the ambulance fleet"
      endpoint="/ambulance"
      idField="ambulance_id"
      columns={[
        { key: "ambulance_id", label: "ID" },
        { key: "vehicle_no", label: "Vehicle No." },
        { key: "vehicle_type", label: "Type" },
        { key: "base_fare", label: "Base Fare", type: "money" },
        { key: "status", label: "Status", type: "badge" },
      ]}
      fields={[
        { name: "vehicle_no", label: "Vehicle No." },
        {
          name: "vehicle_type",
          label: "Type",
          type: "select",
          options: ["Basic", "ICU", "Advanced"],
        },
        { name: "base_fare", label: "Base Fare", type: "number" },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: ["available", "on_trip", "maintenance"],
        },
      ]}
    />
  );
}
