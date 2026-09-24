// Single source of truth for staff work roles.
// Keys are stored in staff.staff_role. Frontend gets this list from GET /api/staff/work-roles.

const WORK_ROLES = {
  FRONT_DESK: {
    label: "Front Desk (Appointments)",
    modules: ["appointments", "unassigned"],
  },
  ADMISSION: {
    label: "Admission Officer",
    modules: ["admissions", "rooms"],
  },
  LAB_TECH: {
    label: "Lab Technician",
    modules: ["labtests"],
  },
  SURGERY_COORD: {
    label: "Surgery Coordinator",
    modules: ["surgeries"],
  },
  BLOOD_BANK: {
    label: "Blood Bank Officer",
    modules: ["blood"],
  },
  BILLING: {
    label: "Billing & Cashier",
    modules: ["billing", "payments"],
  },
  COMPLAINT: {
    label: "Complaint Handler",
    modules: ["complaints"],
  },
};

// Every staff member sees these, whatever the work role is
const COMMON_MODULES = ["overview", "profile", "department", "admin"];

const isValidRole = (role) =>
  typeof role === "string" &&
  Object.prototype.hasOwnProperty.call(WORK_ROLES, role);

const listRoles = () =>
  Object.entries(WORK_ROLES).map(([key, value]) => ({
    key,
    label: value.label,
    modules: value.modules,
  }));

module.exports = { WORK_ROLES, COMMON_MODULES, isValidRole, listRoles };