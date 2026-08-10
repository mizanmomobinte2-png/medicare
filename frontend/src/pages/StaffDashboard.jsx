import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import "../styles/StaffDashboard.css";

const API =
  "http://localhost:5000/api";

function StaffDashboard() {
  const navigate =
    useNavigate();

  let storedStaff = null;

  try {
    storedStaff =
      JSON.parse(
        localStorage.getItem(
          "staff"
        ) || "null"
      );
  } catch {
    storedStaff = null;
  }

  const staffId =
    Number(
      storedStaff?.staff_id ||
      0
    );

  const [
    activePage,
    setActivePage,
  ] = useState(
    "overview"
  );

  const [
    profile,
    setProfile,
  ] = useState(null);

  const [
    department,
    setDepartment,
  ] = useState(null);

  const [
    appointments,
    setAppointments,
  ] = useState([]);

  const [
    unassignedAppointments,
    setUnassignedAppointments,
  ] = useState([]);

  const [
    pendingAdmissions,
    setPendingAdmissions,
  ] = useState([]);

  const [
    allAdmissions,
    setAllAdmissions,
  ] = useState([]);

  const [
    wards,
    setWards,
  ] = useState([]);

  const [
    rooms,
    setRooms,
  ] = useState([]);

  const [
    labTests,
    setLabTests,
  ] = useState([]);

  const [
    labRequests,
    setLabRequests,
  ] = useState([]);

  const [
    surgeries,
    setSurgeries,
  ] = useState([]);

  const [
    surgeryRequests,
    setSurgeryRequests,
  ] = useState([]);

  const [
    bloodRequests,
    setBloodRequests,
  ] = useState([]);

  const [
    bloodBank,
    setBloodBank,
  ] = useState([]);

  const [
    bills,
    setBills,
  ] = useState([]);

  const [
    payments,
    setPayments,
  ] = useState([]);

  const [
    complaints,
    setComplaints,
  ] = useState([]);

  const [
    adminRelations,
    setAdminRelations,
  ] = useState([]);

  const [
    appointmentChanges,
    setAppointmentChanges,
  ] = useState({});

  const [
    admissionForms,
    setAdmissionForms,
  ] = useState({});

  const [
    labForms,
    setLabForms,
  ] = useState({});

  const [
    surgeryForms,
    setSurgeryForms,
  ] = useState({});

  const [
    profileForm,
    setProfileForm,
  ] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [
    bloodForm,
    setBloodForm,
  ] = useState({
    bank_id: "",
    quantity: "",
  });

  const [
    billForm,
    setBillForm,
  ] = useState({
    source_type:
      "appointment",
    source_id: "",
    amount: "",
    discount: "0",
    tax: "0",
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    message,
    setMessage,
  ] = useState("");

  const dateOnly = (
    value
  ) => {
    if (!value) {
      return "";
    }

    return String(
      value
    ).slice(0, 10);
  };

  const timeOnly = (
    value
  ) => {
    if (!value) {
      return "-";
    }

    return String(
      value
    ).slice(0, 5);
  };

  const money = (
    value
  ) => {
    return Number(
      value || 0
    ).toFixed(2);
  };

  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  const safeFetch =
    async (url) => {
      try {
        const response =
          await fetch(url);

        const text =
          await response.text();

        let data = null;

        try {
          data = text
            ? JSON.parse(text)
            : null;
        } catch {
          console.error(
            "Invalid JSON:",
            url,
            text
          );
        }

        return {
          ok:
            response.ok,
          data,
        };
      } catch (error) {
        console.error(
          error
        );

        return {
          ok: false,
          data: null,
        };
      }
    };

  const getWardId = (
    ward
  ) =>
    Number(
      ward.ward_id ||
        ward.id ||
        0
    );

  const getWardName = (
    ward
  ) =>
    ward.ward_name ||
    ward.name ||
    `Ward ${getWardId(
      ward
    )}`;

  const getRoomWardId = (
    room
  ) =>
    Number(
      room.ward_id || 0
    );

  const getRoomName = (
    room
  ) =>
    room.room_number ||
    room.room_no ||
    room.room_type ||
    `Room ${room.room_id}`;

  const loadData =
    async () => {
      if (!staffId) {
        navigate(
          "/login"
        );

        return;
      }

      setLoading(true);

      try {
        const profileResult =
          await safeFetch(
            `${API}/staff/${staffId}`
          );

        if (
          profileResult.ok &&
          profileResult.data
        ) {
          setProfile(
            profileResult.data
          );

          setProfileForm({
            name:
              profileResult.data
                .name || "",

            email:
              profileResult.data
                .email || "",

            phone:
              profileResult.data
                .phone || "",

            password: "",
          });

          if (
            profileResult.data
              .dept_id
          ) {
            const dep =
              await safeFetch(
                `${API}/departments/${profileResult.data.dept_id}`
              );

            if (dep.ok) {
              setDepartment(
                dep.data
              );
            }
          }
        }

        const [
          appointmentResult,
          unassignedResult,
          pendingAdmissionResult,
          admissionResult,
          wardResult,
          roomResult,
          labResult,
          labRequestResult,
          surgeryResult,
          surgeryRequestResult,
          bloodRequestResult,
          bloodBankResult,
          billingResult,
          paymentResult,
          complaintResult,
          adminResult,
        ] =
          await Promise.all(
            [
              safeFetch(
                `${API}/appointments/staff/${staffId}`
              ),

              safeFetch(
                `${API}/appointments/unassigned/all`
              ),

              safeFetch(
                `${API}/admissions/pending/all`
              ),

              safeFetch(
                `${API}/admissions`
              ),

              safeFetch(
                `${API}/wards`
              ),

              safeFetch(
                `${API}/rooms`
              ),

              safeFetch(
                `${API}/lab-tests`
              ),

              safeFetch(
                `${API}/lab-tests/requests/all`
              ),

              safeFetch(
                `${API}/surgeries`
              ),

              safeFetch(
                `${API}/surgeries/requests/all`
              ),

              safeFetch(
                `${API}/blood-bank/requests/staff/${staffId}`
              ),

              safeFetch(
                `${API}/blood-bank`
              ),

              safeFetch(
                `${API}/billing/staff/${staffId}`
              ),

              safeFetch(
                `${API}/payments/staff/${staffId}`
              ),

              safeFetch(
                `${API}/complaints/staff/${staffId}`
              ),

              safeFetch(
                `${API}/staff/${staffId}/admin-relations`
              ),
            ]
          );

        setAppointments(
          Array.isArray(
            appointmentResult.data
          )
            ? appointmentResult.data
            : []
        );

        setUnassignedAppointments(
          Array.isArray(
            unassignedResult.data
          )
            ? unassignedResult.data
            : []
        );

        setPendingAdmissions(
          Array.isArray(
            pendingAdmissionResult.data
          )
            ? pendingAdmissionResult.data
            : []
        );

        setAllAdmissions(
          Array.isArray(
            admissionResult.data
          )
            ? admissionResult.data
            : []
        );

        setWards(
          Array.isArray(
            wardResult.data
          )
            ? wardResult.data
            : []
        );

        setRooms(
          Array.isArray(
            roomResult.data
          )
            ? roomResult.data
            : []
        );

        setLabTests(
          Array.isArray(
            labResult.data
          )
            ? labResult.data
            : []
        );

        setLabRequests(
          Array.isArray(
            labRequestResult.data
          )
            ? labRequestResult.data
            : []
        );

        setSurgeries(
          Array.isArray(
            surgeryResult.data
          )
            ? surgeryResult.data
            : []
        );

        setSurgeryRequests(
          Array.isArray(
            surgeryRequestResult.data
          )
            ? surgeryRequestResult.data
            : []
        );

        setBloodRequests(
          Array.isArray(
            bloodRequestResult.data
          )
            ? bloodRequestResult.data
            : []
        );

        setBloodBank(
          Array.isArray(
            bloodBankResult.data
          )
            ? bloodBankResult.data
            : []
        );

        setBills(
          Array.isArray(
            billingResult.data
          )
            ? billingResult.data
            : []
        );

        setPayments(
          Array.isArray(
            paymentResult.data
          )
            ? paymentResult.data
            : []
        );

        setComplaints(
          Array.isArray(
            complaintResult.data
          )
            ? complaintResult.data
            : []
        );

        setAdminRelations(
          Array.isArray(
            adminResult.data
          )
            ? adminResult.data
            : []
        );
      } catch (error) {
        console.error(
          error
        );

        setMessage(
          "Could not load some staff data."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadData();
  }, [staffId]);

  const currentAdmissions =
    allAdmissions.filter(
      (admission) =>
        admission.status ===
        "admitted"
    );

  const pendingBills =
    bills.filter(
      (bill) =>
        bill.status ===
        "pending"
    );

  const changeAppointment = (
    id,
    field,
    value
  ) => {
    setAppointmentChanges(
      (previous) => ({
        ...previous,

        [id]: {
          ...previous[id],
          [field]: value,
        },
      })
    );
  };

  const saveAppointment =
    async (
      appointment
    ) => {
      const changes =
        appointmentChanges[
          appointment.appt_id
        ] || {};

      const response =
        await fetch(
          `${API}/appointments/${appointment.appt_id}/staff-update`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  staff_id:
                    staffId,

                  appt_date:
                    changes.appt_date ||
                    dateOnly(
                      appointment.appt_date
                    ),

                  appt_time:
                    changes.appt_time ||
                    appointment.appt_time,

                  notes:
                    changes.notes ??
                    appointment.notes,
                }
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Appointment update failed."
        );

        return;
      }

      setMessage(
        "Appointment updated successfully."
      );

      await loadData();
    };

  const changeAdmissionForm = (
    id,
    field,
    value
  ) => {
    setAdmissionForms(
      (previous) => ({
        ...previous,

        [id]: {
          ...previous[id],

          [field]: value,

          ...(field ===
          "ward_id"
            ? {
                room_id: "",
              }
            : {}),
        },
      })
    );
  };

  const availableRooms = (
    wardId
  ) =>
    rooms.filter(
      (room) =>
        String(
          room.status
        ).toLowerCase() ===
          "available" &&
        (!wardId ||
          getRoomWardId(
            room
          ) ===
            Number(
              wardId
            ))
    );

  const admitPatient =
    async (
      admission
    ) => {
      const form =
        admissionForms[
          admission.adm_id
        ] || {};

      if (!form.room_id) {
        setMessage(
          "Select ward and room."
        );

        return;
      }

      const response =
        await fetch(
          `${API}/admissions/${admission.adm_id}/staff-admit`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  room_id:
                    Number(
                      form.room_id
                    ),

                  adm_date:
                    form.adm_date ||
                    today,

                  charge:
                    form.charge
                      ? Number(
                          form.charge
                        )
                      : null,

                  notes:
                    form.notes ||
                    admission.notes ||
                    null,
                }
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Admission failed."
        );

        return;
      }

      setMessage(
        "Patient admitted successfully."
      );

      await loadData();
    };

  const dischargePatient =
    async (
      admission
    ) => {
      if (
        !window.confirm(
          "Discharge this patient?"
        )
      ) {
        return;
      }

      const response =
        await fetch(
          `${API}/admissions/${admission.adm_id}/discharge`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  discharge_date:
                    today,
                }
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Discharge failed."
        );

        return;
      }

      setMessage(
        "Patient discharged successfully."
      );

      await loadData();
    };

  const scheduleLabTest =
    async (
      test
    ) => {
      const form =
        labForms[
          test.test_id
        ] || {};

      if (!form.date) {
        setMessage(
          "Please select lab test date."
        );

        return;
      }

      const response =
        await fetch(
          `${API}/lab-tests/${test.test_id}/staff-schedule`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  staff_id:
                    staffId,

                  date:
                    form.date,

                  unit_price:
                    form.unit_price
                      ? Number(
                          form.unit_price
                        )
                      : null,
                }
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Lab test scheduling failed."
        );

        return;
      }

      setMessage(
        "Lab test scheduled successfully."
      );

      await loadData();
    };

  const scheduleSurgery =
    async (
      surgery
    ) => {
      const form =
        surgeryForms[
          surgery.surgery_id
        ] || {};

      if (!form.date) {
        setMessage(
          "Please select surgery date."
        );

        return;
      }

      const response =
        await fetch(
          `${API}/surgeries/${surgery.surgery_id}/staff-schedule`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  staff_id:
                    staffId,

                  date:
                    form.date,
                }
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Surgery scheduling failed."
        );

        return;
      }

      setMessage(
        "Surgery scheduled successfully."
      );

      await loadData();
    };

  const createBloodRequest =
    async (
      event
    ) => {
      event.preventDefault();

      const response =
        await fetch(
          `${API}/blood-bank/requests`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  staff_id:
                    staffId,

                  bank_id:
                    Number(
                      bloodForm.bank_id
                    ),

                  quantity:
                    Number(
                      bloodForm.quantity
                    ),

                  status:
                    "pending",
                }
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Blood request failed."
        );

        return;
      }

      setMessage(
        "Blood request submitted."
      );

      setBloodForm({
        bank_id: "",
        quantity: "",
      });

      await loadData();
    };

  const isBilled = (
    type,
    id
  ) =>
    bills.some(
      (bill) =>
        bill.source_type ===
          type &&
        Number(
          bill.source_id
        ) ===
          Number(id)
    );

  const billSources =
    useMemo(() => {
      if (
        billForm.source_type ===
        "appointment"
      ) {
        return appointments
          .filter(
            (item) =>
              !isBilled(
                "appointment",
                item.appt_id
              )
          )
          .map(
            (item) => ({
              id:
                item.appt_id,

              label:
                `Appointment #${item.appt_id} - ${item.patient_name}`,
            })
          );
      }

      if (
        billForm.source_type ===
        "admission"
      ) {
        return allAdmissions
          .filter(
            (item) =>
              item.status !==
                "pending" &&
              !isBilled(
                "admission",
                item.adm_id
              )
          )
          .map(
            (item) => ({
              id:
                item.adm_id,

              label:
                `Admission #${item.adm_id} - ${item.patient_name}`,
            })
          );
      }

      if (
        billForm.source_type ===
        "surgery"
      ) {
        return surgeries
          .filter(
            (item) =>
              !isBilled(
                "surgery",
                item.surgery_id
              )
          )
          .map(
            (item) => ({
              id:
                item.surgery_id,

              label:
                `Surgery #${item.surgery_id} - ${item.patient_name} - ${item.surgery_name}`,
            })
          );
      }

      return labTests
        .filter(
          (item) =>
            !isBilled(
              "labtest",
              item.test_id
            )
        )
        .map(
          (item) => ({
            id:
              item.test_id,

            label:
              `Lab Test #${item.test_id} - ${item.patient_name} - ${item.test_name}`,
          })
        );
    }, [
      billForm.source_type,
      appointments,
      allAdmissions,
      surgeries,
      labTests,
      bills,
    ]);

  const createBill =
    async (
      event
    ) => {
      event.preventDefault();

      const response =
        await fetch(
          `${API}/billing/staff/create`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  staff_id:
                    staffId,

                  source_type:
                    billForm.source_type,

                  source_id:
                    Number(
                      billForm.source_id
                    ),

                  amount:
                    Number(
                      billForm.amount
                    ),

                  discount:
                    Number(
                      billForm.discount
                    ) || 0,

                  tax:
                    Number(
                      billForm.tax
                    ) || 0,
                }
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Bill creation failed."
        );

        return;
      }

      setMessage(
        "Bill created successfully."
      );

      setBillForm({
        source_type:
          billForm.source_type,
        source_id: "",
        amount: "",
        discount: "0",
        tax: "0",
      });

      await loadData();
    };

  const approveBill =
    async (
      billId
    ) => {
      const response =
        await fetch(
          `${API}/billing/${billId}/staff-approve`,
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                {
                  staff_id:
                    staffId,
                }
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Bill approval failed."
        );

        return;
      }

      setMessage(
        "Bill approved. Patient can pay now."
      );

      await loadData();
    };

  const updateProfile =
    async (
      event
    ) => {
      event.preventDefault();

      const response =
        await fetch(
          `${API}/staff/${staffId}`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                profileForm
              ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Profile update failed."
        );

        return;
      }

      setMessage(
        "Profile updated successfully."
      );

      await loadData();
    };

  const logout = () => {
    localStorage.removeItem(
      "staff"
    );

    localStorage.removeItem(
      "role"
    );

    navigate(
      "/login"
    );
  };

  if (loading) {
    return (
      <div className="staff-loading">
        Loading staff dashboard...
      </div>
    );
  }

  return (
    <div className="staff-dashboard">

      <aside className="staff-sidebar">

        <h2>MediCare</h2>

        <p>
          {profile?.name ||
            staffId}
        </p>

        {[
          [
            "overview",
            "Dashboard",
          ],
          [
            "profile",
            "My Profile",
          ],
          [
            "appointments",
            "My Appointments",
          ],
          [
            "unassigned",
            "Unassigned Appointments",
          ],
          [
            "admissions",
            "Admissions",
          ],
          [
            "rooms",
            "Ward & Rooms",
          ],
          [
            "labtests",
            "Lab Tests",
          ],
          [
            "surgeries",
            "Surgeries",
          ],
          [
            "blood",
            "Blood Requests",
          ],
          [
            "billing",
            "Billing",
          ],
          [
            "payments",
            "Payments",
          ],
          [
            "complaints",
            "Complaints",
          ],
          [
            "department",
            "My Department",
          ],
          [
            "admin",
            "Admin Relation",
          ],
        ].map(
          ([page, label]) => (
            <button
              key={page}
              onClick={() =>
                setActivePage(
                  page
                )
              }
            >
              {label}
            </button>
          )
        )}

        <button
          className="staff-logout"
          onClick={
            logout
          }
        >
          Logout
        </button>

      </aside>

      <main className="staff-main">

        {message && (
          <div className="staff-message">
            {message}
          </div>
        )}

        {activePage ===
          "overview" && (
          <>
            <h1>
              Staff Dashboard
            </h1>

            <div className="staff-summary-grid">

              <div className="staff-summary-box">
                <h3>
                  Appointments
                </h3>
                <p>
                  {
                    appointments.length
                  }
                </p>
              </div>

              <div className="staff-summary-box">
                <h3>
                  Admission Requests
                </h3>
                <p>
                  {
                    pendingAdmissions.length
                  }
                </p>
              </div>

              <div className="staff-summary-box">
                <h3>
                  Current Admissions
                </h3>
                <p>
                  {
                    currentAdmissions.length
                  }
                </p>
              </div>

              <div className="staff-summary-box">
                <h3>
                  Lab Requests
                </h3>
                <p>
                  {
                    labRequests.length
                  }
                </p>
              </div>

              <div className="staff-summary-box">
                <h3>
                  Surgery Requests
                </h3>
                <p>
                  {
                    surgeryRequests.length
                  }
                </p>
              </div>

              <div className="staff-summary-box">
                <h3>
                  Pending Bills
                </h3>
                <p>
                  {
                    pendingBills.length
                  }
                </p>
              </div>

              <div className="staff-summary-box">
                <h3>
                  Payments
                </h3>
                <p>
                  {
                    payments.length
                  }
                </p>
              </div>

            </div>
          </>
        )}

        {activePage ===
          "profile" && (
          <section className="staff-section">

            <h1>
              My Profile
            </h1>

            <form
              className="staff-form"
              onSubmit={
                updateProfile
              }
            >

              <label>Name</label>

              <input
                value={
                  profileForm.name
                }
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    name:
                      e.target.value,
                  })
                }
              />

              <label>Email</label>

              <input
                value={
                  profileForm.email
                }
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    email:
                      e.target.value,
                  })
                }
              />

              <label>Phone</label>

              <input
                value={
                  profileForm.phone
                }
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    phone:
                      e.target.value,
                  })
                }
              />

              <label>
                New Password
              </label>

              <input
                type="password"
                value={
                  profileForm.password
                }
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    password:
                      e.target.value,
                  })
                }
              />

              <button type="submit">
                Update Profile
              </button>

            </form>

          </section>
        )}

        {activePage ===
          "appointments" && (
          <section className="staff-section">

            <h1>
              My Appointments
            </h1>

            <div className="staff-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {appointments.map(
                    (appointment) => (
                      <tr
                        key={
                          appointment.appt_id
                        }
                      >
                        <td>
                          {appointment.patient_name ||
                            "-"}
                        </td>

                        <td>
                          {appointment.doctor_name ||
                            "-"}
                        </td>

                        <td>
                          <input
                            type="date"
                            value={
                              appointmentChanges[
                                appointment
                                  .appt_id
                              ]?.appt_date ??
                              dateOnly(
                                appointment.appt_date
                              )
                            }
                            onChange={(e) =>
                              changeAppointment(
                                appointment.appt_id,
                                "appt_date",
                                e.target.value
                              )
                            }
                          />
                        </td>

                        <td>
                          <input
                            type="time"
                            value={
                              appointmentChanges[
                                appointment
                                  .appt_id
                              ]?.appt_time ??
                              timeOnly(
                                appointment.appt_time
                              )
                            }
                            onChange={(e) =>
                              changeAppointment(
                                appointment.appt_id,
                                "appt_time",
                                e.target.value
                              )
                            }
                          />
                        </td>

                        <td>
                          {
                            appointment.status
                          }
                        </td>

                        <td>
                          <input
                            value={
                              appointmentChanges[
                                appointment
                                  .appt_id
                              ]?.notes ??
                              appointment.notes ??
                              ""
                            }
                            onChange={(e) =>
                              changeAppointment(
                                appointment.appt_id,
                                "notes",
                                e.target.value
                              )
                            }
                          />
                        </td>

                        <td>
                          <button
                            onClick={() =>
                              saveAppointment(
                                appointment
                              )
                            }
                          >
                            Save
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

          </section>
        )}

        {activePage ===
          "unassigned" && (
          <section className="staff-section">

            <h1>
              Unassigned Appointments
            </h1>

            <div className="staff-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Reason</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {unassignedAppointments.map(
                    (appointment) => (
                      <tr
                        key={
                          appointment.appt_id
                        }
                      >
                        <td>
                          {appointment.patient_name ||
                            "-"}
                        </td>
                        <td>
                          {appointment.doctor_name ||
                            "-"}
                        </td>
                        <td>
                          {dateOnly(
                            appointment.appt_date
                          )}
                        </td>
                        <td>
                          {timeOnly(
                            appointment.appt_time
                          )}
                        </td>
                        <td>
                          {appointment.reason ||
                            "-"}
                        </td>
                        <td>
                          <button
                            onClick={() =>
                              saveAppointment(
                                appointment
                              )
                            }
                          >
                            Assign to Me
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

          </section>
        )}

        {activePage ===
          "admissions" && (
          <>
            <section className="staff-section">

              <h1>
                Pending Admissions
              </h1>

              <div className="staff-table-wrapper">

                <table>

                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Ward</th>
                      <th>Room</th>
                      <th>Date</th>
                      <th>Charge</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pendingAdmissions.map(
                      (admission) => {
                        const form =
                          admissionForms[
                            admission.adm_id
                          ] || {};

                        return (
                          <tr
                            key={
                              admission.adm_id
                            }
                          >
                            <td>
                              {admission.patient_name ||
                                "-"}
                            </td>

                            <td>
                              {admission.doctor_name ||
                                "-"}
                            </td>

                            <td>
                              <select
                                value={
                                  form.ward_id ||
                                  ""
                                }
                                onChange={(e) =>
                                  changeAdmissionForm(
                                    admission.adm_id,
                                    "ward_id",
                                    e.target.value
                                  )
                                }
                              >
                                <option value="">
                                  Select
                                </option>

                                {wards.map(
                                  (ward) => (
                                    <option
                                      key={
                                        getWardId(
                                          ward
                                        )
                                      }
                                      value={
                                        getWardId(
                                          ward
                                        )
                                      }
                                    >
                                      {getWardName(
                                        ward
                                      )}
                                    </option>
                                  )
                                )}
                              </select>
                            </td>

                            <td>
                              <select
                                value={
                                  form.room_id ||
                                  ""
                                }
                                onChange={(e) =>
                                  changeAdmissionForm(
                                    admission.adm_id,
                                    "room_id",
                                    e.target.value
                                  )
                                }
                              >
                                <option value="">
                                  Select
                                </option>

                                {availableRooms(
                                  form.ward_id
                                ).map(
                                  (room) => (
                                    <option
                                      key={
                                        room.room_id
                                      }
                                      value={
                                        room.room_id
                                      }
                                    >
                                      {getRoomName(
                                        room
                                      )}
                                    </option>
                                  )
                                )}
                              </select>
                            </td>

                            <td>
                              <input
                                type="date"
                                value={
                                  form.adm_date ||
                                  today
                                }
                                onChange={(e) =>
                                  changeAdmissionForm(
                                    admission.adm_id,
                                    "adm_date",
                                    e.target.value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <input
                                type="number"
                                value={
                                  form.charge ||
                                  ""
                                }
                                onChange={(e) =>
                                  changeAdmissionForm(
                                    admission.adm_id,
                                    "charge",
                                    e.target.value
                                  )
                                }
                              />
                            </td>

                            <td>
                              <button
                                onClick={() =>
                                  admitPatient(
                                    admission
                                  )
                                }
                              >
                                Admit
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>

                </table>

              </div>

            </section>

            <section className="staff-section">

              <h2>
                Current Admissions
              </h2>

              <div className="staff-table-wrapper">

                <table>

                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Room</th>
                      <th>Date</th>
                      <th>Charge</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentAdmissions.map(
                      (admission) => (
                        <tr
                          key={
                            admission.adm_id
                          }
                        >
                          <td>
                            {admission.patient_name ||
                              "-"}
                          </td>

                          <td>
                            {admission.doctor_name ||
                              "-"}
                          </td>

                          <td>
                            {admission.room_type ||
                              admission.room_id}
                          </td>

                          <td>
                            {dateOnly(
                              admission.adm_date
                            )}
                          </td>

                          <td>
                            {money(
                              admission.charge
                            )}
                          </td>

                          <td>
                            <button
                              onClick={() =>
                                dischargePatient(
                                  admission
                                )
                              }
                            >
                              Discharge
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>

                </table>

              </div>

            </section>
          </>
        )}

        {activePage ===
          "rooms" && (
          <section className="staff-section">

            <h1>
              Ward & Rooms
            </h1>

            <div className="staff-table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>Room ID</th>
                    <th>Ward ID</th>
                    <th>Room</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {rooms.map(
                    (room) => (
                      <tr
                        key={
                          room.room_id
                        }
                      >
                        <td>
                          {
                            room.room_id
                          }
                        </td>
                        <td>
                          {getRoomWardId(
                            room
                          )}
                        </td>
                        <td>
                          {getRoomName(
                            room
                          )}
                        </td>
                        <td>
                          {
                            room.status
                          }
                        </td>
                      </tr>
                    )
                  )}
                </tbody>

              </table>

            </div>

          </section>
        )}

        {activePage ===
          "labtests" && (
          <section className="staff-section">

            <h1>
              Lab Test Requests
            </h1>

            <div className="staff-table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Test</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {labRequests.map(
                    (test) => {
                      const form =
                        labForms[
                          test.test_id
                        ] || {};

                      return (
                        <tr
                          key={
                            test.test_id
                          }
                        >

                          <td>
                            {test.patient_name ||
                              "-"}
                          </td>

                          <td>
                            {test.doctor_name ||
                              "-"}
                          </td>

                          <td>
                            {test.test_name ||
                              "-"}
                          </td>

                          <td>
                            {test.type ||
                              "-"}
                          </td>

                          <td>
                            <input
                              type="date"
                              value={
                                form.date ??
                                dateOnly(
                                  test.date
                                )
                              }
                              onChange={(e) =>
                                setLabForms({
                                  ...labForms,

                                  [test.test_id]:
                                    {
                                      ...form,

                                      date:
                                        e
                                          .target
                                          .value,
                                    },
                                })
                              }
                            />
                          </td>

                          <td>
                            <input
                              type="number"
                              value={
                                form.unit_price ??
                                test.unit_price ??
                                ""
                              }
                              onChange={(e) =>
                                setLabForms({
                                  ...labForms,

                                  [test.test_id]:
                                    {
                                      ...form,

                                      unit_price:
                                        e
                                          .target
                                          .value,
                                    },
                                })
                              }
                            />
                          </td>

                          <td>
                            {
                              test.status
                            }
                          </td>

                          <td>
                            <button
                              onClick={() =>
                                scheduleLabTest(
                                  test
                                )
                              }
                            >
                              Schedule
                            </button>
                          </td>

                        </tr>
                      );
                    }
                  )}

                  {labRequests.length ===
                    0 && (
                    <tr>
                      <td colSpan="8">
                        No lab test requests.
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </section>
        )}

        {activePage ===
          "surgeries" && (
          <section className="staff-section">

            <h1>
              Surgery Requests
            </h1>

            <div className="staff-table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Surgery</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {surgeryRequests.map(
                    (surgery) => {
                      const form =
                        surgeryForms[
                          surgery.surgery_id
                        ] || {};

                      return (
                        <tr
                          key={
                            surgery.surgery_id
                          }
                        >
                          <td>
                            {surgery.patient_name ||
                              "-"}
                          </td>

                          <td>
                            {surgery.doctor_name ||
                              "-"}
                          </td>

                          <td>
                            {surgery.surgery_name ||
                              "-"}
                          </td>

                          <td>
                            {surgery.type ||
                              "-"}
                          </td>

                          <td>
                            <input
                              type="date"
                              value={
                                form.date ??
                                dateOnly(
                                  surgery.date
                                )
                              }
                              onChange={(e) =>
                                setSurgeryForms({
                                  ...surgeryForms,

                                  [surgery.surgery_id]:
                                    {
                                      ...form,

                                      date:
                                        e
                                          .target
                                          .value,
                                    },
                                })
                              }
                            />
                          </td>

                          <td>
                            {
                              surgery.status
                            }
                          </td>

                          <td>
                            <button
                              onClick={() =>
                                scheduleSurgery(
                                  surgery
                                )
                              }
                            >
                              Schedule
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}

                  {surgeryRequests.length ===
                    0 && (
                    <tr>
                      <td colSpan="7">
                        No surgery requests.
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </section>
        )}

        {activePage ===
          "blood" && (
          <section className="staff-section">

            <h1>
              Blood Request
            </h1>

            <form
              className="staff-form"
              onSubmit={
                createBloodRequest
              }
            >

              <select
                value={
                  bloodForm.bank_id
                }
                onChange={(e) =>
                  setBloodForm({
                    ...bloodForm,
                    bank_id:
                      e.target.value,
                  })
                }
                required
              >
                <option value="">
                  Select Blood
                </option>

                {bloodBank.map(
                  (bank) => (
                    <option
                      key={
                        bank.bank_id
                      }
                      value={
                        bank.bank_id
                      }
                    >
                      {bank.blood_group} -{" "}
                      {
                        bank.available_quantity
                      }
                    </option>
                  )
                )}
              </select>

              <input
                type="number"
                placeholder="Quantity"
                value={
                  bloodForm.quantity
                }
                onChange={(e) =>
                  setBloodForm({
                    ...bloodForm,
                    quantity:
                      e.target.value,
                  })
                }
                required
              />

              <button type="submit">
                Submit Request
              </button>

            </form>

          </section>
        )}

        {activePage ===
          "billing" && (
          <>
            <section className="staff-section">

              <h1>Billing</h1>

              <form
                className="staff-form"
                onSubmit={
                  createBill
                }
              >

                <label>
                  Bill Type
                </label>

                <select
                  value={
                    billForm.source_type
                  }
                  onChange={(e) =>
                    setBillForm({
                      ...billForm,

                      source_type:
                        e.target.value,

                      source_id: "",
                    })
                  }
                >
                  <option value="appointment">
                    Appointment
                  </option>
                  <option value="admission">
                    Admission
                  </option>
                  <option value="surgery">
                    Surgery
                  </option>
                  <option value="labtest">
                    Lab Test
                  </option>
                </select>

                <label>
                  Select Item
                </label>

                <select
                  value={
                    billForm.source_id
                  }
                  onChange={(e) =>
                    setBillForm({
                      ...billForm,

                      source_id:
                        e.target.value,
                    })
                  }
                  required
                >

                  <option value="">
                    Select
                  </option>

                  {billSources.map(
                    (source) => (
                      <option
                        key={
                          source.id
                        }
                        value={
                          source.id
                        }
                      >
                        {
                          source.label
                        }
                      </option>
                    )
                  )}

                </select>

                <label>Amount</label>

                <input
                  type="number"
                  value={
                    billForm.amount
                  }
                  onChange={(e) =>
                    setBillForm({
                      ...billForm,

                      amount:
                        e.target.value,
                    })
                  }
                  required
                />

                <label>
                  Discount
                </label>

                <input
                  type="number"
                  value={
                    billForm.discount
                  }
                  onChange={(e) =>
                    setBillForm({
                      ...billForm,

                      discount:
                        e.target.value,
                    })
                  }
                />

                <label>Tax</label>

                <input
                  type="number"
                  value={
                    billForm.tax
                  }
                  onChange={(e) =>
                    setBillForm({
                      ...billForm,

                      tax:
                        e.target.value,
                    })
                  }
                />

                <button type="submit">
                  Create Bill
                </button>

              </form>

            </section>

            <section className="staff-section">

              <h2>
                My Bills
              </h2>

              <div className="staff-table-wrapper">

                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Patient</th>
                      <th>Type</th>
                      <th>Source</th>
                      <th>Net</th>
                      <th>Paid</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {bills.map(
                      (bill) => (
                        <tr
                          key={
                            bill.bill_id
                          }
                        >
                          <td>
                            {
                              bill.bill_id
                            }
                          </td>
                          <td>
                            {bill.patient_name ||
                              "-"}
                          </td>
                          <td>
                            {
                              bill.source_type
                            }
                          </td>
                          <td>
                            {
                              bill.source_id
                            }
                          </td>
                          <td>
                            {money(
                              bill.net_amount
                            )}
                          </td>
                          <td>
                            {money(
                              bill.paid_amount
                            )}
                          </td>
                          <td>
                            {
                              bill.status
                            }
                          </td>
                          <td>
                            {bill.status ===
                            "pending" ? (
                              <button
                                onClick={() =>
                                  approveBill(
                                    bill.bill_id
                                  )
                                }
                              >
                                Approve
                              </button>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>

              </div>

            </section>
          </>
        )}

        {activePage ===
          "payments" && (
          <section className="staff-section">

            <h1>
              Payments
            </h1>

            <div className="staff-table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Bill ID</th>
                    <th>Type</th>
                    <th>Paid</th>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map(
                    (payment) => (
                      <tr
                        key={
                          payment.payment_id
                        }
                      >
                        <td>
                          {payment.patient_name ||
                            "-"}
                        </td>
                        <td>
                          {
                            payment.bill_id
                          }
                        </td>
                        <td>
                          {payment.source_type ||
                            "-"}
                        </td>
                        <td>
                          {money(
                            payment.amount
                          )}
                        </td>
                        <td>
                          {dateOnly(
                            payment.payment_date
                          )}
                        </td>
                        <td>
                          {payment.method ||
                            "-"}
                        </td>
                        <td>
                          {payment.bill_status ||
                            "-"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>

              </table>

            </div>

          </section>
        )}

        {activePage ===
          "complaints" && (
          <section className="staff-section">

            <h1>
              Complaints
            </h1>

            <div className="staff-table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {complaints.map(
                    (complaint) => (
                      <tr
                        key={
                          complaint.complaint_id
                        }
                      >
                        <td>
                          {complaint.patient_name ||
                            "-"}
                        </td>
                        <td>
                          {complaint.complaint_type ||
                            "-"}
                        </td>
                        <td>
                          {complaint.description ||
                            "-"}
                        </td>
                        <td>
                          {complaint.status ||
                            "-"}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>

              </table>

            </div>

          </section>
        )}

        {activePage ===
          "department" && (
          <section className="staff-section">

            <h1>
              My Department
            </h1>

            <p>
              <strong>ID:</strong>{" "}
              {department?.dept_id ||
                "-"}
            </p>

            <p>
              <strong>Name:</strong>{" "}
              {department?.dept_name ||
                department?.department_name ||
                "-"}
            </p>

          </section>
        )}

        {activePage ===
          "admin" && (
          <section className="staff-section">

            <h1>
              Admin Relation
            </h1>

            {adminRelations.map(
              (
                relation,
                index
              ) => (
                <p key={index}>
                  Admin ID:{" "}
                  {
                    relation.admin_id
                  }
                </p>
              )
            )}

          </section>
        )}

      </main>

    </div>
  );
}

export default StaffDashboard;