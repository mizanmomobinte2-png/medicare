import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { group: "Main", links: [{ to: "/", label: "Dashboard" }] },
  {
    group: "People",
    links: [
      { to: "/patients", label: "Patients" },
      { to: "/doctors", label: "Doctors" },
      { to: "/staff", label: "Staff" },
      { to: "/admin", label: "Admin" },
    ],
  },
  {
    group: "Hospital",
    links: [
      { to: "/departments", label: "Departments" },
      { to: "/wards", label: "Wards" },
      { to: "/rooms", label: "Rooms" },
      { to: "/blood-bank", label: "Blood Bank" },
    ],
  },
  {
    group: "Clinical",
    links: [
      { to: "/appointments", label: "Appointments" },
      { to: "/time-slots", label: "Time Slots" },
      { to: "/prescriptions", label: "Prescriptions" },
      { to: "/medical-items", label: "Medical Items" },
      { to: "/lab-tests", label: "Lab Tests" },
      { to: "/surgeries", label: "Surgeries" },
      { to: "/admissions", label: "Admissions" },
    ],
  },
  {
    group: "Finance & Support",
    links: [
      { to: "/insurance", label: "Insurance" },
      { to: "/billing", label: "Billing" },
      { to: "/payments", label: "Payments" },
      { to: "/complaints", label: "Complaints" },
    ],
  },
];

export default function Layout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h1>Medi<span>Care</span></h1>
        <nav>
          {navItems.map((section) => (
            <div key={section.group}>
              <div className="nav-group">{section.group}</div>
              {section.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }) => (isActive ? "active" : "")}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
