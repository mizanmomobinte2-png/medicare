import CrudPage from "../components/CrudPage";

export default function TimeSlotsPage() {
  return (
    <CrudPage
      title="Time Slots"
      description="Manage doctor time slots"
      endpoint="/time-slots"
      idField="slot_id"
      lookups={{ doctors: "/doctors" }}
      columns={[
        { key: "slot_id", label: "ID" },
        { key: "doctor_name", label: "Doctor" },
        { key: "slot_date", label: "Date", type: "date" },
        { key: "start_time", label: "Start" },
        { key: "end_time", label: "End" },
        { key: "room", label: "Room" },
        { key: "status", label: "Status", type: "badge" },
      ]}
      fields={[
        { name: "doctor_id", label: "Doctor", type: "select", lookup: "doctors", optionValue: "doctor_id", optionLabel: "name" },
        { name: "slot_date", label: "Date", type: "date" },
        { name: "start_time", label: "Start Time", type: "time" },
        { name: "end_time", label: "End Time", type: "time" },
        { name: "room", label: "Room" },
        { name: "status", label: "Status", type: "select", options: ["available", "booked", "cancelled"], default: "available" },
      ]}
    />
  );
}
